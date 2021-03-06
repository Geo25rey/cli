/* eslint-disable max-nested-callbacks */
import { expect, test } from '@oclif/test'
import { MailscriptApiServer } from './constants'
import { cli } from 'cli-ux'

describe('workflows', () => {
  describe('list', () => {
    test
      .stdout()
      .nock(MailscriptApiServer, (api) =>
        api.get('/workflows').reply(200, { list: [] }),
      )
      .command(['workflows:list'])
      .exit(0)
      .it('gives message if no workflows', (ctx) => {
        expect(ctx.stdout).to.contain(
          "you don't have an workflow currently, create one with: mailscript workflows:add",
        )
      })

    test
      .stdout()
      .nock(MailscriptApiServer, (api) =>
        api.get('/workflows').reply(200, { list: [{ id: 'dR862asdfgh' }] }),
      )
      .command(['workflows:list'])
      .it('lists workflows by id', (ctx) => {
        expect(ctx.stdout).to.contain('dR862asdfgh')
      })
  })

  describe('add', () => {
    let postBody: any

    beforeEach(() => {
      postBody = {}
    })

    const nockRead = (api: any) => {
      return api
        .persist()
        .get('/accessories')
        .reply(200, {
          list: [
            {
              id: 'access-01-xxx-yyy-zzz',
              name: 'test@mailscript.io',
              type: 'mailscript-email',
            },
            {
              id: 'webhook-xyz',
              name: 'webhook',
              type: 'mailscript-email',
            },
            {
              id: 'access-03-xxx-yyy-zzz',
              name: 'test-sms',
              type: 'sms',
              sms: '+7766767556',
            },
          ],
        })
    }

    const nockAdd = (api: any) => {
      api
        .persist()
        .get('/accessories')
        .reply(200, {
          list: [
            {
              id: 'access-01-xxx-yyy-zzz',
              name: 'test@mailscript.io',
              type: 'mailscript-email',
              address: 'test@mailscript.io',
            },
            {
              id: 'webhook-xyz',
              name: 'webhook',
              type: 'mailscript-email',
            },
            {
              id: 'access-03-xxx-yyy-zzz',
              name: 'test-sms',
              type: 'sms',
              sms: '+7766767556',
            },
          ],
        })

      return api
        .post('/workflows', (body: any) => {
          postBody = body
          return true
        })
        .reply(201, { id: 'auto-xxx-yyy-zzz' })
    }

    const nockAddAlias = (api: any) => {
      api
        .persist()
        .get('/accessories')
        .reply(200, {
          list: [
            {
              id: 'access-01-xxx-yyy-zzz',
              name: 'test@mailscript.io',
              type: 'mailscript-email',
              address: 'test@mailscript.io',
            },
            {
              id: 'webhook-xyz',
              name: 'webhook',
              type: 'mailscript-email',
            },
            {
              id: 'access-03-xxx-yyy-zzz',
              name: 'test-sms',
              type: 'sms',
              sms: '+7766767556',
            },
          ],
        })
        .get('/user')
        .reply(200, { email: 'smith@example.com' })

      return api
        .post('/workflows', (body: any) => {
          postBody = body
          return true
        })
        .reply(201, { id: 'auto-xxx-yyy-zzz' })
    }

    const nockAddFromVerificationsList = (api: any) => {
      api
        .persist()
        .get('/accessories')
        .reply(200, {
          list: [
            {
              id: 'access-01-xxx-yyy-zzz',
              name: 'test@mailscript.io',
              type: 'mailscript-email',
              address: 'test@mailscript.io',
            },
            {
              id: 'webhook-xyz',
              name: 'webhook',
              type: 'mailscript-email',
            },
            {
              id: 'access-03-xxx-yyy-zzz',
              name: 'test-sms',
              type: 'sms',
              sms: '+7766767556',
            },
          ],
        })
        .get('/user')
        .reply(200, { email: 'smith@example.com' })
        .get('/verifications')
        .reply(200, {
          list: [
            { type: 'email', email: 'another@example.com', verified: true },
          ],
        })

      return api
        .post('/workflows', (body: any) => {
          postBody = body
          return true
        })
        .reply(201, { id: 'auto-xxx-yyy-zzz' })
    }

    const nockAddUnverified = (api: any) => {
      return api
        .persist()
        .get('/accessories')
        .reply(200, {
          list: [
            {
              id: 'access-01-xxx-yyy-zzz',
              name: 'test@mailscript.io',
              type: 'mailscript-email',
              address: 'test@mailscript.io',
            },
            {
              id: 'webhook-xyz',
              name: 'webhook',
              type: 'mailscript-email',
            },
            {
              id: 'access-03-xxx-yyy-zzz',
              name: 'test-sms',
              type: 'sms',
              sms: '+7766767556',
            },
          ],
        })
        .get('/user')
        .reply(200, { email: 'smith@example.com' })
        .get('/verifications')
        .reply(200, {
          list: [
            { type: 'email', email: 'another@example.com', verified: true },
          ],
        })
    }

    test
      .stdout()
      .command(['workflows:add'])
      .exit(2)
      .it('fails if no name provided')

    describe('triggers', () => {
      describe('time based', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--times',
            '5',
            '--seconds',
            '50',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [],
              times: {
                thisManySeconds: 50,
                thisManyTimes: 5,
              },
            })
          })

        test
          .stdout()
          .nock(MailscriptApiServer, nockRead)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--times',
            '5',
          ])
          .exit(1)
          .it('errors if times proved but not seconds', (ctx) => {
            expect(ctx.stdout).to.contain(
              'Flag --seconds required when using --times',
            )
          })

        test
          .stdout()
          .nock(MailscriptApiServer, nockRead)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--seconds',
            '120',
          ])
          .exit(1)
          .it('errors if seconds provided but not times', (ctx) => {
            expect(ctx.stdout).to.contain(
              'Flag --times required when using --seconds',
            )
          })
      })

      describe('from', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--from',
            'smith@example.com',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  from: 'smith@example.com',
                },
              ],
            })
          })
      })

      describe('sentto', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--sentto',
            'test+spam@mailscript.io',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  sentTo: 'test+spam@mailscript.io',
                },
              ],
            })
          })
      })

      describe('subjectContains', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--subjectcontains',
            'alert',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  subjectContains: 'alert',
                },
              ],
            })
          })
      })

      describe('domain', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--domain',
            'example.com',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  domain: 'example.com',
                },
              ],
            })
          })
      })

      describe('hasTheWords', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--hasthewords',
            'alert',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  hasTheWords: 'alert',
                },
              ],
            })
          })
      })

      describe('hasAttachments', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--hasattachments',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  hasAttachments: true,
                },
              ],
            })
          })
      })

      describe('all', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
            '--from',
            'smith@example.com',
            '--sentto',
            'test+spam@mailscript.io',
            '--subjectcontains',
            'a subject',
            '--domain',
            'example.com',
            '--hasthewords',
            'alert',
            '--hasattachments',
          ])
          .it('adds workflow on the server', (ctx) => {
            expect(ctx.stdout).to.contain('Workflow setup: work-01')
            expect(postBody.trigger.config).to.eql({
              criterias: [
                {
                  domain: 'example.com',
                  from: 'smith@example.com',
                  sentTo: 'test+spam@mailscript.io',
                  hasAttachments: true,
                  hasTheWords: 'alert',
                  subjectContains: 'a subject',
                },
              ],
            })
          })
      })
    })

    describe('types', () => {
      describe('forward', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--action',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
          ])
          .it('add forward workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              type: 'forward',
              forward: 'another@example.com',
            })
          })

        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--forward',
            'another@example.com',
          ])
          .it('defaults action to trigger if none provided', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
          })
      })

      describe('send', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--send',
            'another@example.com',
            '--subject',
            'subject',
            '--text',
            'text',
          ])
          .it('add send workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              subject: 'subject',
              text: 'text',
              to: 'another@example.com',
              type: 'send',
            })
          })
      })

      describe('reply', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--reply',
            '--text',
            'text',
          ])
          .it('add reply workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              type: 'reply',
              text: 'text',
            })
          })
      })

      describe('reply all', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--replyall',
            '--text',
            'text',
          ])
          .it('add reply all workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              type: 'replyAll',
              text: 'text',
            })
          })
      })

      describe('alias', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAddAlias)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--alias',
            'smith@example.com',
            '--text',
            'text',
          ])
          .it('add alias workflow if email users email', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              type: 'alias',
              alias: 'smith@example.com',
            })
          })

        test
          .stdout()
          .nock(MailscriptApiServer, nockAddFromVerificationsList)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--alias',
            'another@example.com',
            '--text',
            'text',
          ])
          .it('add alias workflow if email verified', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].config).to.eql({
              type: 'alias',
              alias: 'another@example.com',
            })
          })

        test
          .stdout()
          .nock(MailscriptApiServer, nockAddUnverified)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--alias',
            'unknown@example.com',
            '--text',
            'text',
            '--noninteractive',
          ])
          .exit(1)
          .it('error if not verified', (ctx) => {
            expect(ctx.stdout).to.contain(
              'Error: the email address unknown@example.com must be verified before being included in an alias workflow',
            )
          })
      })

      describe('webhook', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--webhook',
            'http://example.com/webhook',
          ])
          .it('add webhook workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].accessoryId.startsWith('webhook-'))
            expect(postBody.actions[0].config).to.eql({
              type: 'webhook',
              url: 'http://example.com/webhook',
              opts: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'POST',
              },
              body: '',
            })
          })
      })

      describe('sms', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockAdd)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--action',
            'test-sms',
            '--text',
            'from mailscript - {{subject}}',
          ])
          .it('add sms workflow', (ctx) => {
            expect(ctx.stdout).to.contain('work-01')
            expect(postBody.actions[0].accessoryId).to.eql(
              'access-03-xxx-yyy-zzz',
            )
            expect(postBody.actions[0].config).to.eql({
              type: 'sms',
              text: 'from mailscript - {{subject}}',
            })
          })
      })

      describe('multiple types', () => {
        test
          .stdout()
          .nock(MailscriptApiServer, nockRead)
          .command([
            'workflows:add',
            '--name',
            'work-01',
            '--trigger',
            'test@mailscript.io',
            '--alias',
            'another@mailscript.io',
            '--send',
            'another@mailscript.io',
            '--text',
            'text',
          ])
          .exit(1)
          .it('it errors', (ctx) => {
            expect(ctx.stdout).to.contain('Please provide one type flag either')
          })
      })
    })
  })

  describe('delete', () => {
    test
      .stdout()
      .nock(MailscriptApiServer, (api) => {
        return api.delete('/workflows/work-01-xxx-yyy-zzz').reply(204)
      })
      .command(['workflows:delete', '--workflow', 'work-01-xxx-yyy-zzz'])
      .it('deletes workflow on the server', (ctx) => {
        expect(ctx.stdout).to.contain('Workflow deleted: work-01-xxx-yyy-zzz')
      })

    test
      .stdout()
      .command(['workflows:delete'])
      .exit(2)
      .it('errors if no workflow id provided')
  })
})

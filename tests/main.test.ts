import { describe, test, expect, vi } from 'vitest';

import { getPayload } from '../src/index';
import { Inputs } from '../src/input';

vi.mock('../src/context', async () => {
  const payload = (await import('./payload/push_tag.json')).default;
  return {
    getContext: () => ({
      payload,

      eventName: 'push',
      ref: 'refs/tags/simple-tag',
      sha: 'abcdef1234567890',
      workflow: 'push-ci',
      actor: 'Codertocat',
      runId: 123123,
      job: 'notify',
      serverUrl: 'https://githubactions.serverurl.example.com',

      repo: {
        owner: 'Codertocat',
        repo: 'Hello-World',
      },
    }),
  };
});

vi.mock('../src/format', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/format')>();
  return {
    ...actual,
    formatEvent: vi.fn(() => 'mocked format event'),
  };
});

const contextFields = [
  {
    name: 'Repository',
    value: '[Codertocat/Hello-World](https://githubactions.serverurl.example.com/Codertocat/Hello-World)',
    inline: true,
  },
  {
    name: 'Ref',
    value: 'simple-tag',
    inline: true,
  },
  {
    name: 'Event - push',
    value: 'mocked format event',
    inline: false,
  },
  {
    name: 'Triggered by',
    value: 'Codertocat',
    inline: true,
  },
  {
    name: 'Workflow',
    value: '[push-ci](https://githubactions.serverurl.example.com/Codertocat/Hello-World/actions/runs/123123)',
    inline: true,
  },
  {
    name: 'Commit',
    value: '[`abcdef1`](https://githubactions.serverurl.example.com/Codertocat/Hello-World/commit/abcdef1234567890)',
    inline: true,
  },
  {
    name: 'Job',
    value: 'notify',
    inline: true,
  },
];

const defaultRunUrl = 'https://githubactions.serverurl.example.com/Codertocat/Hello-World/actions/runs/123123';

describe('getPayload(Inputs)', () => {
  const baseInputs: Inputs = {
    nocontext: false,
    noprefix: false,
    notimestamp: false,
    webhooks: ['https://webhook.invalid'],
    status: 'success',
    description: '',
    content: '',
    content_on_failure: '',
    mention_on: 'always',
    title: '',
    image: '',
    color: undefined,
    url: '',
    username: '',
    avatar_url: '',
    ack_no_webhook: false,
    job_results: [],
  };

  test('default', () => {
    const inputs: Inputs = {
      ...baseInputs,
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('nodetail', () => {
    const inputs: Inputs = {
      ...baseInputs,
      nocontext: true,
      noprefix: true,
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          url: defaultRunUrl,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('nodetail with job', () => {
    const inputs: Inputs = {
      ...baseInputs,
      nocontext: true,
      noprefix: true,
      title: 'nodetail title',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'nodetail title',
          url: defaultRunUrl,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('nocontext', () => {
    const inputs: Inputs = {
      ...baseInputs,
      nocontext: true,
      title: 'nocontext title',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success: nocontext title',
          url: defaultRunUrl,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('nocontext with notimestamp', () => {
    const inputs: Inputs = {
      ...baseInputs,
      nocontext: true,
      notimestamp: true,
      title: 'nocontext title',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          title: 'Success: nocontext title',
          url: defaultRunUrl,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('notimestamp', () => {
    const inputs: Inputs = {
      ...baseInputs,
      notimestamp: true,
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('noprefix', () => {
    const inputs: Inputs = {
      ...baseInputs,
      noprefix: true,
      title: 'noprefix title',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'noprefix title',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('description', () => {
    const inputs: Inputs = {
      ...baseInputs,
      description: 'description test',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          description: 'description test',
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('title', () => {
    const inputs: Inputs = {
      ...baseInputs,
      title: 'job test',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success: job test',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('url', () => {
    const inputs: Inputs = {
      ...baseInputs,
      title: 'job test',
      url: 'https://example.com',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success: job test',
          url: 'https://example.com',
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('image', () => {
    const inputs: Inputs = {
      ...baseInputs,
      image: 'https://example.com/testimage.png',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          image: {
            url: 'https://example.com/testimage.png',
          },
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('color', () => {
    const inputs: Inputs = {
      ...baseInputs,
      color: 0xfff000,
    };
    const want = {
      embeds: [
        {
          color: 0xfff000,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('no color defaults to job status color', () => {
    const inputs: Inputs = {
      ...baseInputs,
      status: 'failure',
    };
    const want = {
      embeds: [
        {
          color: 0xcb2431,
          timestamp: expect.any(String),
          title: 'Failure',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('color 0 is accepted', () => {
    const inputs: Inputs = {
      ...baseInputs,
      color: 0,
    };
    const want = {
      embeds: [
        {
          color: 0,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('username', () => {
    const inputs: Inputs = {
      ...baseInputs,
      username: 'username test',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
      username: 'username test',
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('avatar_url', () => {
    const inputs: Inputs = {
      ...baseInputs,
      avatar_url: 'https://avatar.invalid/avatar.png',
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
      avatar_url: 'https://avatar.invalid/avatar.png',
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('content', () => {
    const inputs: Inputs = {
      ...baseInputs,
      content: "hey i'm mentioning <@316911818725392384>",
    };
    const want = {
      embeds: [
        {
          color: 0x28a745,
          timestamp: expect.any(String),
          title: 'Success',
          url: defaultRunUrl,
          fields: contextFields,
        },
      ],
      content: "hey i'm mentioning <@316911818725392384>",
      allowed_mentions: { parse: [], users: ['316911818725392384'] },
    };
    expect(getPayload(inputs)).toStrictEqual(want);
  });

  test('mention_on failure omits content on success', () => {
    const inputs: Inputs = {
      ...baseInputs,
      mention_on: 'failure',
      content: '<@316911818725392384>',
    };
    expect(getPayload(inputs)).not.toHaveProperty('content');
  });

  test('mention_on failure includes content_on_failure for timed_out', () => {
    const inputs: Inputs = {
      ...baseInputs,
      status: 'timed_out',
      mention_on: 'failure',
      content: 'always ping',
      content_on_failure: '<@316911818725392384> timed out',
    };
    const got = getPayload(inputs) as any;
    expect(got.content).toBe('<@316911818725392384> timed out');
    expect(got.embeds[0].title).toBe('Timed Out');
  });
});

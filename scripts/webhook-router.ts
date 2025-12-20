#!/usr/bin/env npx tsx
/**
 * Webhook Event Router
 * GitHub Webhookイベントをルーティングして適切な処理を実行
 */

type EventType = 'issue' | 'pr' | 'push' | 'comment';

interface EventContext {
  type: EventType;
  action: string;
  identifier: string;
}

function parseArgs(): EventContext {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: webhook-router.ts <event-type> <action> [identifier]');
    process.exit(1);
  }

  return {
    type: args[0] as EventType,
    action: args[1],
    identifier: args[2] || '',
  };
}

async function handleIssueEvent(action: string, issueNumber: string): Promise<void> {
  console.log(`🎫 Processing Issue Event: ${action} for #${issueNumber}`);

  switch (action) {
    case 'opened':
      console.log('  → New issue opened, ready for triage');
      break;
    case 'labeled':
      console.log('  → Issue labeled, checking for automation triggers');
      break;
    case 'closed':
      console.log('  → Issue closed');
      break;
    case 'reopened':
      console.log('  → Issue reopened');
      break;
    case 'assigned':
      console.log('  → Issue assigned');
      break;
    default:
      console.log(`  → Unhandled action: ${action}`);
  }
}

async function handlePREvent(action: string, prNumber: string): Promise<void> {
  console.log(`🔀 Processing PR Event: ${action} for #${prNumber}`);

  switch (action) {
    case 'opened':
      console.log('  → New PR opened, ready for review');
      break;
    case 'closed':
      console.log('  → PR closed/merged');
      break;
    case 'reopened':
      console.log('  → PR reopened');
      break;
    case 'review_requested':
      console.log('  → Review requested');
      break;
    case 'ready_for_review':
      console.log('  → PR marked ready for review');
      break;
    default:
      console.log(`  → Unhandled action: ${action}`);
  }
}

async function handlePushEvent(branch: string, commitSha: string): Promise<void> {
  console.log(`📤 Processing Push Event: ${branch} @ ${commitSha.substring(0, 7)}`);

  if (branch === 'main') {
    console.log('  → Push to main branch detected');
  } else if (branch.startsWith('feat/')) {
    console.log('  → Feature branch push detected');
  } else if (branch.startsWith('fix/')) {
    console.log('  → Fix branch push detected');
  }
}

async function handleCommentEvent(issueNumber: string, author: string): Promise<void> {
  console.log(`💬 Processing Comment Event: #${issueNumber} by ${author}`);

  // Check for command patterns
  const commentBody = process.env.COMMENT_BODY || '';

  if (commentBody.startsWith('/')) {
    console.log('  → Command detected in comment');
    const command = commentBody.split(' ')[0];
    console.log(`  → Command: ${command}`);
  }
}

async function main(): Promise<void> {
  const context = parseArgs();

  console.log('═══════════════════════════════════════');
  console.log('📨 Webhook Event Router');
  console.log('═══════════════════════════════════════');
  console.log(`Event Type: ${context.type}`);
  console.log(`Action: ${context.action}`);
  console.log(`Identifier: ${context.identifier}`);
  console.log('───────────────────────────────────────');

  try {
    switch (context.type) {
      case 'issue':
        await handleIssueEvent(context.action, context.identifier);
        break;
      case 'pr':
        await handlePREvent(context.action, context.identifier);
        break;
      case 'push':
        await handlePushEvent(context.action, context.identifier);
        break;
      case 'comment':
        await handleCommentEvent(context.action, context.identifier);
        break;
      default:
        console.log(`Unknown event type: ${context.type}`);
    }

    console.log('───────────────────────────────────────');
    console.log('✅ Event processing complete');
  } catch (error) {
    console.error('❌ Error processing event:', error);
    process.exit(1);
  }
}

main();

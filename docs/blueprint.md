# Photo Caption Enforcer — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Telegram group moderation bot that automatically deletes uncaptioned photos to prevent image spam and enforce caption policies. Immediately removes single photos or albums without captions, with configurable notifications and admin controls for enforcement settings.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram group admins
- Moderators of image-focused communities

## Success criteria

- Uncaptioned photos are deleted within 1 second of posting
- Admins can toggle enforcement and notification settings via commands
- Audit log tracks all deletion events with user and message metadata

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main admin menu for configuration
- **/enable_captions** (command, actor: admin, command: /enable_captions) — Enable caption enforcement in this group
- **/disable_captions** (command, actor: admin, command: /disable_captions) — Disable caption enforcement
- **/notify_admins_on_delete** (command, actor: admin, command: /notify_admins_on_delete) — Toggle admin notifications for deletions
- **/set_notice** (command, actor: admin, command: /set_notice) — Toggle in-group deletion notices
- **/deletions** (command, actor: admin, command: /deletions) — View recent deletion history
- **Appeal** (button, actor: user, callback: appeal:request) — Appeal deletion to admins

## Flows

### Photo moderation
_Trigger:_ photo message received

1. Check if caption exists
2. Delete message if no caption
3. Send in-group notice if enabled
4. Send admin alert if enabled
5. Log deletion to audit

_Data touched:_ Group settings, Audit log

### Admin configuration
_Trigger:_ /start by admin

1. Display configuration menu
2. Handle command execution
3. Confirm setting changes

_Data touched:_ Group settings

### Deletion appeal
_Trigger:_ Appeal button clicked

1. Show appeal form
2. Forward to admins
3. Log appeal request

_Data touched:_ Audit log

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Group settings** _(retention: persistent)_ — Per-group moderation configuration
  - fields: enforcement_enabled, admin_notifications, in_group_notices, audit_retention_days
- **Audit log** _(retention: persistent)_ — Record of all deleted messages and moderation actions
  - fields: timestamp, user_id, username, message_id, caption_present, group_id

## Integrations

- **Telegram** (required) — Bot API messaging and moderation
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Enable/disable caption enforcement
- Configure notification preferences
- View deletion history
- Set audit retention period

## Notifications

- In-group deletion notice (ephemeral)
- Admin direct message alert
- Appeal button in deletion notice

## Permissions & privacy

- Message deletion permissions
- Message read permissions
- Admin-only configuration access
- Audit log data retention

## Edge cases

- Albums with empty caption deleted as single unit
- Non-photo media ignored
- Text-only messages ignored
- Bot added to multiple groups with per-group settings

## Required tests

- Verify uncaptioned photo deletion within 1s
- Test command access for non-admin users
- Validate audit log persistence
- Confirm appeal workflow

## Assumptions

- Default enforcement enabled on group join
- Albums treated as single message unit
- In-group notices default ON
- Admin recognition via Telegram API

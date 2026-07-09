import { pgTable, text, index, boolean, timestamp, bigint } from 'drizzle-orm/pg-core'
import { user } from '@/features/auth/auth.schema'

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('stripe'),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  status: text('status').notNull().default('none'),
  plan: text('plan').notNull().default('free'),
  priceId: text('price_id'),
  currentPeriodEnd: bigint('current_period_end', { mode: 'number' }),            // epoch ms
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  lifetime: boolean('lifetime').notNull().default(false),
  lifetimePaymentIntentId: text('lifetime_payment_intent_id'), // 买断那笔付款的 PI——退款事件按此精确匹配，防止同客户其他 charge 的退款误撤终身授权

  paymentFailedAt: bigint('payment_failed_at', { mode: 'number' }),              // epoch ms；非空 = 续费扣款失败待用户处理（清除于恢复扣款）
  lastEventAt: bigint('last_event_at', { mode: 'number' }),                      // epoch ms；已应用的最新订阅流事件时间（乱序守卫，见 applyDomainEvent）
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (t) => [
  index('subscription_customer_id_idx').on(t.customerId), // 每个 Stripe webhook 都按 customerId 查行——热路径
])

export const processedWebhookEvents = pgTable('processed_webhook_events', {
  eventId: text('event_id').primaryKey(),
  processedAt: timestamp('processed_at').notNull(),
  // 'pending' = 已认领未落库（apply 中/曾中途死掉）；'done' = 已应用。D1 无跨语句事务，
  // 认领与落库间的宕机窗口靠「陈旧 pending 可被重试接管」闭合（见 handleWebhook）。
  status: text('status').notNull().default('done'),
})

export type Subscription = typeof subscription.$inferSelect

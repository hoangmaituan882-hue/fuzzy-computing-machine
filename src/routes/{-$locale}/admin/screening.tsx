import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ImageUp, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/features/auth/auth.client'
import { SCREENING_GROUP_IMAGE_ACCEPT } from '@/features/screening/screening-assets'
import {
  getAdminScreeningGroupProfilesFn,
  saveScreeningGroupProfileFn,
  uploadScreeningGroupProfileImageFn,
} from '@/features/screening/screening.fns'
import type { PublicScreeningGroupProfile } from '@/features/screening/screening.server'

export const Route = createFileRoute('/{-$locale}/admin/screening')({
  loader: () => getAdminScreeningGroupProfilesFn(),
  component: ScreeningAdmin,
})

const GROUP_LABELS: Record<PublicScreeningGroupProfile['groupId'], string> = {
  group1: '一群',
  group2: '二群',
  group3: '三群',
}

function ProfileCard({ profile }: { profile: PublicScreeningGroupProfile }) {
  const router = useRouter()
  const [title, setTitle] = useState(profile.title)
  const [subtitle, setSubtitle] = useState(profile.subtitle)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function saveText() {
    setSaving(true)
    try {
      await saveScreeningGroupProfileFn({
        data: { groupId: profile.groupId, title, subtitle },
      })
      toast.success(`${GROUP_LABELS[profile.groupId]}身份已保存`)
      await router.invalidate()
    } catch (error: any) {
      toast.error(error.message || '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(file?: File) {
    if (!file) return
    const form = new FormData()
    form.append('groupId', profile.groupId)
    form.append('file', file)
    setUploading(true)
    try {
      const result = await uploadScreeningGroupProfileImageFn({ data: form })
      if (!result.ok) {
        const message: Record<typeof result.reason, string> = {
          noFile: '请选择图片文件',
          group: '群身份无效',
          empty: '图片文件为空',
          type: '只支持 PNG、JPG、WebP',
          size: '图片不能超过 5MB',
        }
        toast.error(message[result.reason])
        return
      }
      toast.success(`${GROUP_LABELS[profile.groupId]}身份图已上传`)
      await router.invalidate()
    } catch (error: any) {
      toast.error(error.message || '上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-56 bg-slate-100 dark:bg-slate-900">
        {profile.imageUrl ? (
          <img src={profile.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,.35),transparent_32%),linear-gradient(135deg,#0f172a,#334155)] text-white">
            <ImageUp size={44} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
            {GROUP_LABELS[profile.groupId]}
          </div>
          <div className="mt-1 text-2xl font-black">{title || profile.title}</div>
          <div className="text-sm font-semibold text-white/75">{subtitle || profile.subtitle}</div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor={`${profile.groupId}-title`}>身份称号</Label>
          <Input
            id={`${profile.groupId}-title`}
            value={title}
            maxLength={40}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：船长一群"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${profile.groupId}-subtitle`}>身份说明</Label>
          <Input
            id={`${profile.groupId}-subtitle`}
            value={subtitle}
            maxLength={60}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="例如：稳健预测派"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex h-[38px] cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-border-strong px-[14px] text-sm font-semibold text-foreground transition-colors hover:bg-bg-alt">
            <ImageUp size={16} />
            {uploading ? '上传中...' : '上传身份图'}
            <input
              type="file"
              accept={SCREENING_GROUP_IMAGE_ACCEPT}
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void uploadImage(event.currentTarget.files?.[0])}
            />
          </label>
          <Button type="button" size="sm" disabled={saving} onClick={saveText}>
            <Save size={16} />
            {saving ? '保存中...' : '保存文字'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ScreeningAdmin() {
  const profiles = Route.useLoaderData()
  const { data: session } = authClient.useSession()

  return (
    <AppShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email ?? '',
        role: session?.user?.role ?? 'admin',
        image: session?.user?.image ?? null,
      }}
      active="admin-screening"
      crumb="群身份"
    >
      <div className="mb-6">
        <h1 className="page-h">群身份轮播配置</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">
          上传三张无限旋转木马使用的身份图片，并为每个群配置前台展示的身份称号。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard key={profile.groupId} profile={profile} />
        ))}
      </div>
    </AppShell>
  )
}

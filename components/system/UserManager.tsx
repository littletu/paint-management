'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Users, ChevronDown, ChevronUp, Shield, ShieldOff } from 'lucide-react'

export const ALL_SECTIONS = [
  { key: 'dashboard',    label: '儀表板' },
  { key: 'customers',    label: '客戶管理' },
  { key: 'projects',     label: '工程管理' },
  { key: 'workers',      label: '師傅管理' },
  { key: 'time-reports', label: '工時報表' },
  { key: 'payroll',      label: '薪資管理' },
  { key: 'expenses',     label: '開銷管理' },
  { key: 'invoices',     label: '請款管理' },
  { key: 'accounting',   label: '帳目總覽' },
  { key: 'system',       label: '系統管理' },
]

export const WORKER_SECTIONS = [
  { key: 'worker-issues', label: '妙根老塞' },
]

interface Profile {
  id: string
  full_name: string | null
  role: string
  allowed_sections: string[] | null
}

interface Props {
  profiles: Profile[]
  currentUserId: string
}

function UserRow({ profile, currentUserId }: { profile: Profile; currentUserId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState(profile.role)
  // null = full access, array = restricted
  const [sections, setSections] = useState<string[] | null>(profile.allowed_sections)

  const isSelf = profile.id === currentUserId
  const isFullAccess = sections === null

  function toggle(key: string) {
    if (isFullAccess) {
      // Switch from full → restricted (all except this one)
      setSections(allKeys.filter(k => k !== key))
    } else {
      setSections(prev =>
        prev!.includes(key) ? prev!.filter(k => k !== key) : [...prev!, key]
      )
    }
  }

  function setFullAccess(full: boolean) {
    setSections(full ? null : allKeys)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role, allowed_sections: sections })
      .eq('id', profile.id)
    if (error) { toast.error('儲存失敗：' + error.message); setSaving(false); return }
    toast.success('已更新')
    router.refresh()
    setSaving(false)
    setOpen(false)
  }

  const allKeys = [...ALL_SECTIONS, ...WORKER_SECTIONS].map(s => s.key)
  const enabledCount = isFullAccess ? allKeys.length : (sections?.length ?? 0)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => !isSelf && setOpen(o => !o)}
        disabled={isSelf}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">{profile.full_name ?? '（未命名）'}</span>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {role === 'admin' ? '管理員' : '師傅'}
            </Badge>
            {isSelf && <span className="text-xs text-gray-400">（你自己）</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isFullAccess ? '完整存取所有區塊' : `可存取 ${enabledCount} / ${ALL_SECTIONS.length} 個區塊`}
          </p>
        </div>
        {!isSelf && (
          open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Permission editor */}
      {open && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
          {/* Role selector */}
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">角色</p>
              <p className="text-xs text-gray-400">管理員可登入後台，師傅只能使用行動端</p>
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {(['admin', 'worker'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    role === r ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r === 'admin' ? '管理員' : '師傅'}
                </button>
              ))}
            </div>
          </div>

          {/* Full access toggle */}
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">完整存取</p>
              <p className="text-xs text-gray-400">開啟後可存取所有區塊</p>
            </div>
            <button
              onClick={() => setFullAccess(!isFullAccess)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isFullAccess ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                isFullAccess ? 'translate-x-4' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Admin section checkboxes */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">管理後台</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_SECTIONS.map(section => {
                const enabled = isFullAccess || (sections?.includes(section.key) ?? false)
                return (
                  <button
                    key={section.key}
                    onClick={() => toggle(section.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      enabled
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {enabled
                      ? <Shield className="w-3.5 h-3.5 shrink-0" />
                      : <ShieldOff className="w-3.5 h-3.5 shrink-0" />
                    }
                    {section.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Worker section checkboxes */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">師傅端功能</p>
            <div className="grid grid-cols-2 gap-1.5">
              {WORKER_SECTIONS.map(section => {
                const enabled = isFullAccess || (sections?.includes(section.key) ?? false)
                return (
                  <button
                    key={section.key}
                    onClick={() => toggle(section.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      enabled
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {enabled
                      ? <Shield className="w-3.5 h-3.5 shrink-0" />
                      : <ShieldOff className="w-3.5 h-3.5 shrink-0" />
                    }
                    {section.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? '儲存中...' : '儲存權限'}
            </button>
            <button
              onClick={() => { setOpen(false); setSections(profile.allowed_sections) }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function UserManager({ profiles, currentUserId }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          用戶管理
          <span className="text-xs font-normal text-gray-400 ml-1">{profiles.length} 位</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {profiles.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">尚無用戶</p>
        )}
        {profiles.map(profile => (
          <UserRow key={profile.id} profile={profile} currentUserId={currentUserId} />
        ))}
      </CardContent>
    </Card>
  )
}

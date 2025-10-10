'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type Post = {
  id: number
  title: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBio, setNewBio] = useState('')
  const [newAvatar, setNewAvatar] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 프로필 정보 불러오기
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setNewName(profileData.display_name || '')
      setNewBio(profileData.bio || '')
    }

    // 내가 쓴 글 불러오기
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPosts(postsData || [])
  }

  // 프로필 이미지 업로드
  async function uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) {
      alert('이미지 업로드 실패: ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  // 프로필 저장
  async function saveProfile() {
    if (!profile) return
    let avatarUrl = profile.avatar_url

    if (newAvatar) {
      const uploaded = await uploadAvatar(newAvatar)
      if (uploaded) avatarUrl = uploaded
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: newName.trim() || null,
        bio: newBio.trim() || null,
        avatar_url: avatarUrl
      })
      .eq('id', profile.id)

    if (error) {
      alert('프로필 업데이트 실패: ' + error.message)
      return
    }

    alert('프로필이 수정되었습니다!')
    setIsEditing(false)
    load()
  }

  if (!profile) return <div className="p-8">프로필을 불러오는 중...</div>

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">내 프로필</h1>

      {/* 프로필 보기 / 수정 */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block mb-1 font-semibold">닉네임</label>
            <input
              className="w-full border rounded p-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="닉네임 입력"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">자기소개</label>
            <textarea
              className="w-full border rounded p-2 h-24"
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="자기소개를 입력하세요"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">프로필 이미지</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewAvatar(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={saveProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          )}
          <p><strong>닉네임:</strong> {profile.display_name || '이름 없음'}</p>
          <p><strong>이메일:</strong> {profile.email}</p>
          <p><strong>가입일:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          <p><strong>소개:</strong> {profile.bio || '자기소개가 없습니다.'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded mt-2"
          >
            프로필 수정
          </button>
        </div>
      )}

      <hr className="my-6" />

      {/* 작성한 글 */}
      <div>
        <h2 className="text-xl font-semibold mb-3">내가 쓴 글</h2>
        {posts.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {posts.map((post) => (
              <li
                key={post.id}
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                {post.title}
                <span className="text-gray-500 text-sm ml-2">
                  ({new Date(post.created_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">작성한 글이 없습니다.</p>
        )}
      </div>
    </div>
  )
}

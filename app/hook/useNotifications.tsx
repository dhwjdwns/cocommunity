"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Noti = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: any;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(userId?: string) {
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);

  // 중복 제거 함수
  const dedup = (arr: Noti[]) => {
    const seen = new Set<string>();
    const out: Noti[] = [];
    for (const n of arr) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        out.push(n);
      }
    }
    return out;
  };

  useEffect(() => {
    if (!userId) return;

    // 초기 로드
    (async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[noti/select]", error);
        return;
      }
      const list = dedup((data ?? []) as Noti[]);
      setItems(list);
      setUnread(list.filter((n) => !n.read_at).length);
    })();

    // 실시간 구독
    const channel = supabase
      .channel(`noti:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Noti;
          setItems((prev) => {
            const next = dedup([n, ...prev]);
            setUnread(next.filter((x) => !x.read_at).length);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const deletedId = (payload as any)?.old?.id as string | undefined;

          if (deletedId) {
            setItems((prev) => {
              const next = prev.filter((x) => x.id !== deletedId);
              setUnread(next.filter((x) => !x.read_at).length);
              return next;
            });
            return;
          }

          // 🔁 old.id가 없는 환경에서는 전체 재조회
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

          if (!error) {
            const list = (data ?? []) as Noti[];
            setItems(list);
            setUnread(list.filter((n) => !n.read_at).length);
          } else {
            console.error("[noti/delete/refresh]", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 개별 삭제
  const removeOne = async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((n) => n.id !== id);
    setUnread(next.filter((n) => !n.read_at).length);
      return next;
    });

    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      console.error("[noti/delete one]", error);
      // 실패 시 새로고침
      if (userId) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        const list = dedup((data ?? []) as Noti[]);
        setItems(list);
        setUnread(list.filter((n) => !n.read_at).length);
      }
    }
  };

  // 전체 삭제
  const clearAll = async () => {
    if (!userId) return;
    const prev = items;
    setItems([]);
    setUnread(0);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    if (error) {
      console.error("[noti/clear all]", error);
      setItems(prev);
      setUnread(prev.filter((n) => !n.read_at).length);
    }
  };

  return { items, unread, removeOne, clearAll };
}

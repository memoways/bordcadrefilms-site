"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: string;
  order: number;
};

type TeamFromAPI = {
  members: TeamMember[];
  total: number;
  source: string;
};

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition">
      {member.image && (
        <div className="relative h-48 rounded-xl overflow-hidden bg-zinc-100">
          <Image src={member.image} alt={member.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-zinc-900">{member.name}</h3>
      <p className="text-sm font-medium text-zinc-600">{member.role}</p>
      {member.bio && <p className="text-sm text-zinc-600 leading-relaxed flex-grow">{member.bio}</p>}
    </div>
  );
}

export default function AboutTeamCarousel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch("/api/team", {
          next: { revalidate: 3600, tags: ["team"] },
        } as RequestInit);

        if (res.ok) {
          const json = (await res.json()) as { ok: boolean; data?: TeamFromAPI };
          if (json.ok && json.data?.members) {
            setMembers(json.data.members.sort((a, b) => a.order - b.order));
          }
        }
      } catch (error) {
        console.error("[AboutTeamCarousel] Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-16 px-4 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="h-10 w-32 bg-zinc-200 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-zinc-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) return null;

  return (
    <section className="w-full py-16 px-4 bg-zinc-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-semibold text-zinc-900 mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
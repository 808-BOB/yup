"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

interface EventRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  location: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EventsPage() {
  const { data: events, error } = useSWR<EventRow[]>("/api/events", fetcher);

  if (!events && !error) {
    return <div className="min-h-screen flex items-center justify-center">Loading events…</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Failed to load events</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      <ul className="space-y-4">
        {events?.map((ev) => (
          <li key={ev.id} className="border border-gray-700 p-4 rounded">
            <h2 className="font-semibold text-lg">{ev.title}</h2>
            <p className="text-sm text-gray-400">{ev.date} – {ev.location}</p>
            <Link href={`/events/${ev.slug}`} className="text-primary text-sm underline mt-2 inline-block">
              View event
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 
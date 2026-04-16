"use client";

import { useActionState } from "react";
import { submitContact, type ContactFormState } from "./actions";

const initialState: ContactFormState = { status: "idle" };

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900">Message sent!</p>
        <p className="text-zinc-600 mt-1">We&apos;ll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="border border-zinc-300 rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border border-zinc-300 rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium text-zinc-700">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="border border-zinc-300 rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 resize-none"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-normal hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}

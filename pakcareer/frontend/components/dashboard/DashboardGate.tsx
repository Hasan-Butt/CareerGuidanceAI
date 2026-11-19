"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { fetchMyOrg } from "@/lib/api";
import { clearOrgKey, getOrgKey, setOrgKey } from "@/lib/auth";
import type { OrgRecord } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Counsellor sign-in. Student results are private, so the dashboard asks for
 * the organisation's access key and the API only returns that organisation's
 * students.
 */
export function DashboardGate({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [checking, setChecking] = useState(true);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = getOrgKey();
      if (saved) {
        try {
          const me = await fetchMyOrg(saved);
          if (!cancelled) setOrg(me);
        } catch {
          clearOrgKey();
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setError(null);
    setChecking(true);
    try {
      const me = await fetchMyOrg(key);
      setOrgKey(key);
      setOrg(me);
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(status === 401 ? "That access key is not valid." : (err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const signOut = () => {
    clearOrgKey();
    setOrg(null);
    setKeyInput("");
  };

  if (checking) {
    return <div className="py-20 text-center text-slate-500">Checking access…</div>;
  }

  if (!org) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#0f766e]" />
              Counsellor sign-in
            </CardTitle>
            <CardDescription>
              Enter your institution&apos;s dashboard access key. You will only see students who
              used your invite code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-key">Access key</Label>
                <Input
                  id="org-key"
                  type="password"
                  autoComplete="current-password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste the key you were given"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm">
        <span className="text-[#0f2f38]">
          Signed in as <strong>{org.name}</strong>
          <span className="ml-2 text-xs text-slate-500">invite code {org.invite_code}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-xs">
          <LogOut className="w-3.5 h-3.5 mr-1" /> Sign out
        </Button>
      </div>
      {children}
    </div>
  );
}

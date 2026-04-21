"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  User,
  Check,
  X,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { properties: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"COHOST" | "ADMIN">("COHOST");
  const [saving, setSaving] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"COHOST" | "ADMIN">("COHOST");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPw, setShowEditPw] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCurrentUserId(d.id))
      .catch(() => {});
  }, [fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() || null, password: newPassword, role: newRole }),
    });
    if (res.ok) {
      setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("COHOST"); setShowAdd(false);
      setToast("User created");
      await fetchUsers();
    } else {
      const err = await res.json().catch(() => ({}));
      setToast(`Error: ${err.error || "Failed"}`);
    }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const body: Record<string, string | null> = { email: editEmail.trim(), name: editName.trim() || null, role: editRole };
    if (editPassword) body.password = editPassword;
    const res = await fetch(`/api/users/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { setEditId(null); setToast("User updated"); await fetchUsers(); }
    else { const err = await res.json().catch(() => ({})); setToast(`Error: ${err.error || "Failed"}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) { setToast("User deleted"); await fetchUsers(); }
    else { const err = await res.json().catch(() => ({})); setToast(`Error: ${err.error || "Failed"}`); }
  };

  if (loading) {
    return <AdminSidebar><div className="flex items-center justify-center h-full"><RefreshCw className="h-5 w-5 animate-spin text-gray-400" /></div></AdminSidebar>;
  }

  return (
    <AdminSidebar>
      <div className="p-6 max-w-3xl mx-auto">
        {toast && (
          <div className={cn("px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 mb-4", toast.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
            {toast}
            <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Users <span className="text-gray-400 font-normal ml-1">({users.length})</span></h2>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "outline" : "default"}>
            {showAdd ? <><X className="h-3.5 w-3.5 mr-1.5" /> Cancel</> : <><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add User</>}
          </Button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-lg border shadow-sm mb-4">
            <form onSubmit={handleAdd} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" required className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Optional" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Password</label>
                  <div className="relative">
                    <Input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-9 pr-9" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNewPw(!showNewPw)}>
                      {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setNewRole("COHOST")} className={cn("flex-1 h-9 rounded-md text-sm font-medium border transition-colors", newRole === "COHOST" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")}>Co-host</button>
                    <button type="button" onClick={() => setNewRole("ADMIN")} className={cn("flex-1 h-9 rounded-md text-sm font-medium border transition-colors", newRole === "ADMIN" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")}>Admin</button>
                  </div>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={saving || !newEmail.trim() || !newPassword} className="w-full">
                <Plus className="h-3.5 w-3.5 mr-1.5" />{saving ? "Creating..." : "Create User"}
              </Button>
            </form>
          </div>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg border shadow-sm hover:shadow transition-shadow">
              {editId === user.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-gray-500 mb-1 block">Email</label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-8" /></div>
                    <div><label className="text-xs font-medium text-gray-500 mb-1 block">Name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
                      <div className="relative">
                        <Input type={showEditPw ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Leave blank to keep" className="h-8 pr-9" />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowEditPw(!showEditPw)}>
                          {showEditPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setEditRole("COHOST")} disabled={user.id === currentUserId} className={cn("flex-1 h-8 rounded-md text-sm font-medium border transition-colors", editRole === "COHOST" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500", user.id === currentUserId && "opacity-50 cursor-not-allowed")}>Co-host</button>
                        <button type="button" onClick={() => setEditRole("ADMIN")} disabled={user.id === currentUserId} className={cn("flex-1 h-8 rounded-md text-sm font-medium border transition-colors", editRole === "ADMIN" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500", user.id === currentUserId && "opacity-50 cursor-not-allowed")}>Admin</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 gap-1" onClick={handleSaveEdit}><Check className="h-3 w-3" /> Save</Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 group">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white", user.role === "ADMIN" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-blue-600")}>
                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{user.name || user.email}</span>
                      <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium", user.role === "ADMIN" ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600")}>
                        {user.role === "ADMIN" ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                        {user.role === "ADMIN" ? "Admin" : "Co-host"}
                      </span>
                      {user.id === currentUserId && <span className="text-[10px] text-gray-400">you</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {user.name && <span>{user.email}</span>}
                      <span>{user._count.properties} listing{user._count.properties !== 1 ? "s" : ""}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px]">
                      <DropdownMenuItem onClick={() => { setEditId(user.id); setEditEmail(user.email); setEditName(user.name || ""); setEditRole(user.role as "COHOST" | "ADMIN"); setEditPassword(""); setShowEditPw(false); }}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                      </DropdownMenuItem>
                      {user.id !== currentUserId && (
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminSidebar>
  );
}

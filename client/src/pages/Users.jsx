import { createElement, useEffect, useMemo, useState } from "react";
import { Mail, MessageSquareText, Phone, Search, ShieldCheck, Trash2, UserRound, Users2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { InfoBanner, PageSection, PageShell, SurfaceCard } from "../components/ui.jsx";

export function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, location.pathname, navigate, token, user]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    let cancelled = false;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [{ data: usersData }, { data: messagesData }] = await Promise.all([
          API.get("/admin/users"),
          API.get("/contact"),
        ]);

        if (!cancelled) {
          setUsers(usersData.users ?? []);
          setMessages(messagesData.messages ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error.message || "Unable to load admin data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, token]);

  const nonAdminUsers = useMemo(
    () => users.filter((item) => !(item?.role === "admin" || item?.isAdmin)),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return nonAdminUsers;

    return nonAdminUsers.filter((item) =>
      [item.username, item.name, item.email, item.phone, item.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [nonAdminUsers, searchTerm]);

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return messages;

    return messages.filter((item) =>
      [item.name, item.email, item.subject, item.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [messages, searchTerm]);

  const handleDeleteUser = async (userId) => {
    try {
      const { data: result } = await API.delete(`/admin/users/${userId}`);

      setUsers((current) => current.filter((item) => item._id !== userId));
      setMessageType("success");
      setMessage(result.message || "User deleted successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Unable to delete user");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const { data: result } = await API.delete(`/contact/${messageId}`);

      setMessages((current) => current.filter((item) => item._id !== messageId));
      setMessageType("success");
      setMessage(result.message || "Contact message deleted successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.response?.data?.message || "Unable to delete contact message");
    }
  };

  if (!token || !isAdmin) return null;

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading users and messages...</SurfaceCard></PageShell></PageSection>;
  }

  return (
    <PageSection className="pt-8 sm:pt-12">
      <PageShell className="space-y-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-50 via-indigo-50 to-sky-100 p-6 shadow-[0_32px_90px_-48px_rgba(30,41,59,0.38)] sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Admin users</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-800" style={{ fontFamily: "var(--font-display)" }}>
                Platform Control Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Manage platform users, review inbound support messages, and keep the admin workspace aligned with the rest of StayFinder.
              </p>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search user, email, phone or message"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 sm:w-96"
              />
            </label>
          </div>

          {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"} className="mb-6">{message}</InfoBanner> : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Registered Users", value: nonAdminUsers.length, accent: "bg-sky-100 text-sky-600", icon: Users2 },
              { label: "Owners", value: nonAdminUsers.filter((item) => item.role === "owner").length, accent: "bg-indigo-100 text-indigo-600", icon: ShieldCheck },
              { label: "Residents", value: nonAdminUsers.filter((item) => item.role === "user").length, accent: "bg-emerald-100 text-emerald-600", icon: UserRound },
              { label: "Messages", value: messages.length, accent: "bg-amber-100 text-amber-600", icon: MessageSquareText },
            ].map(({ label, value, accent, icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-800">{value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${accent}`}>
                    {createElement(icon, { size: 20 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm font-medium text-slate-600">User management</p>
              <p className="mt-1 text-xs text-slate-500">Showing {filteredUsers.length} of {nonAdminUsers.length} users</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 sm:px-8">User</th>
                  <th className="px-6 py-4 sm:px-8">Email</th>
                  <th className="px-6 py-4 sm:px-8">Phone</th>
                  <th className="px-6 py-4 sm:px-8">Role</th>
                  <th className="w-[8.5rem] px-6 py-4 text-right sm:px-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                      No users available.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item._id} className="transition hover:bg-indigo-50/60">
                      <td className="px-6 py-5 sm:px-8">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {(item.username || item.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.username || item.name}</p>
                            <p className="mt-1 text-xs text-slate-500">Joined {new Date(item.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="break-words px-6 py-5 text-slate-600 sm:px-8">{item.email || "No email"}</td>
                      <td className="break-words px-6 py-5 text-slate-600 sm:px-8">{item.phone || "No phone"}</td>
                      <td className="px-6 py-5 sm:px-8">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          item.role === "owner"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {item.role || "user"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        <button
                          type="button"
                          className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
                          onClick={() => handleDeleteUser(item._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm font-medium text-slate-600">Contact messages</p>
              <p className="mt-1 text-xs text-slate-500">Showing {filteredMessages.length} of {messages.length} messages</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="w-[12%] px-6 py-4 sm:px-8">Sender</th>
                  <th className="w-[20%] px-6 py-4 sm:px-8">Email</th>
                  <th className="w-[16%] px-6 py-4 sm:px-8">Subject</th>
                  <th className="w-[32%] px-6 py-4 sm:px-8">Message</th>
                  <th className="w-[12%] px-6 py-4 sm:px-8">Date</th>
                  <th className="w-[8.5rem] px-6 py-4 text-right sm:px-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                      No contact messages available.
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map((item) => (
                    <tr key={item._id} className="transition hover:bg-indigo-50/60">
                      <td className="px-6 py-5 sm:px-8">
                        <p className="break-words font-semibold text-slate-800">{item.name}</p>
                      </td>
                      <td className="break-words px-6 py-5 text-slate-600 sm:px-8">{item.email}</td>
                      <td className="break-words px-6 py-5 text-slate-600 sm:px-8">{item.subject || "General inquiry"}</td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">
                        <p className="line-clamp-2 break-words">{item.message}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-slate-600 sm:px-8">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        <button
                          type="button"
                          className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
                          onClick={() => handleDeleteMessage(item._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>
    </PageSection>
  );
}

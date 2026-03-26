import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { FormField, InfoBanner, PageSection, PageShell, SectionHeading, SelectInput, SurfaceCard, TextArea, TextInput } from "../components/ui.jsx";

const initialEditState = {
  title: "",
  price: "",
  location: "",
  city: "",
  address: "",
  gender: "unisex",
  roomType: "single",
  totalRooms: "0",
  availableRooms: "0",
  description: "",
  amenities: "",
  images: [],
};

const readFilesAsDataUrls = async (files) =>
  Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Unable to read image"));
          reader.readAsDataURL(file);
        })
    )
  );

export function ManagePG() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin" || Boolean(user?.isAdmin);
  const [pgs, setPgs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(initialEditState);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isOwner) {
      navigate("/", { replace: true });
    }
  }, [isOwner, location.pathname, navigate, token, user]);

  useEffect(() => {
    if (!location.state?.flashMessage) return;

    setMessageType(location.state.flashTone === "error" ? "error" : "success");
    setMessage(location.state.flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!token || !isOwner) return;

    let cancelled = false;

    const loadOwnerData = async () => {
      setLoading(true);
      setMessage("");
      setMessageType("info");

      try {
        const [{ data: pgData }, { data: bookingData }] = await Promise.all([
          API.get("/owner/pgs"),
          API.get("/owner/bookings"),
        ]);

        if (!cancelled) {
          setPgs(pgData.pgs ?? []);
          setBookings(bookingData.bookings ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error?.response?.data?.message || "Unable to load owner data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOwnerData();

    return () => {
      cancelled = true;
    };
  }, [isOwner, token]);

  const bookingsByPg = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const pgId = booking.pg?._id;
      if (!pgId) return;
      const existing = map.get(pgId) ?? [];
      existing.push(booking);
      map.set(pgId, existing);
    });
    return map;
  }, [bookings]);

  const startEdit = (pg) => {
    setEditingId(pg._id);
    setEditForm({
      title: pg.title,
      price: String(pg.price),
      location: pg.location,
      city: pg.city,
      address: pg.address ?? pg.location ?? "",
      gender: pg.gender,
      roomType: pg.roomType ?? "single",
      totalRooms: String(pg.totalRooms ?? pg.availableRooms ?? 0),
      availableRooms: String(pg.availableRooms),
      description: pg.description ?? "",
      amenities: (pg.amenities ?? []).join(", "),
      images: pg.images ?? [],
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditImages = async (event) => {
    try {
      const images = await readFilesAsDataUrls(event.target.files);
      setEditForm((current) => ({ ...current, images }));
      setMessage("");
    } catch {
      setMessageType("error");
      setMessage("Some images could not be loaded.");
    }
  };

  const saveEdit = async () => {
    setMessage("");
    setMessageType("info");

    try {
      const { data } = await API.put("/pg/update", {
        id: editingId,
        ...editForm,
        area: editForm.location,
        address: editForm.address || editForm.location,
        totalRooms: Number(editForm.totalRooms),
        images: editForm.images,
        amenities: editForm.amenities.split(",").map((item) => item.trim()).filter(Boolean),
        price: Number(editForm.price),
        availableRooms: Number(editForm.availableRooms),
      });

      setPgs((current) => current.map((pg) => (pg._id === editingId ? data.pg : pg)));
      setEditingId("");
      setMessageType("success");
      setMessage(data.message || "PG updated successfully and sent back for admin approval");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.response?.data?.message || "Unable to update PG");
    }
  };

  const deletePg = async (pgId) => {
    try {
      const { data } = await API.delete("/pg/delete", { data: { id: pgId } });

      setPgs((current) => current.filter((pg) => pg._id !== pgId));
      setBookings((current) => current.filter((booking) => booking.pg?._id !== pgId));
      setMessageType("success");
      setMessage(data.message || "PG deleted successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.response?.data?.message || "Unable to delete PG");
    }
  };

  if (!token || !isOwner) return null;

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading your PG listings...</SurfaceCard></PageShell></PageSection>;
  }

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <SectionHeading
          kicker="Manage PGs"
          title="Edit listings, remove them, and view resident bookings."
          description="Everything for your existing properties is available here in one management space."
        />
        {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"}>{message}</InfoBanner> : null}

        <div className="space-y-6">
          {pgs.length === 0 ? (
            <SurfaceCard className="p-8">
              <h2 className="panel-title">No PGs yet</h2>
              <p className="mt-3 muted-note">Your listings will appear here once you add one.</p>
            </SurfaceCard>
          ) : null}

          {pgs.map((pg) => (
            <SurfaceCard key={pg._id} className="space-y-6 p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-500">PG listing</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink-900">{pg.title}</h2>
                  <p className="mt-2 text-sm text-ink-500">{pg.location}</p>
                  <div className="mt-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      pg.isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {pg.isApproved ? "Approved" : "Waiting for approval"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(pg)}><Pencil size={16} />Edit</button>
                  <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => deletePg(pg._id)}><Trash2 size={16} />Delete</button>
                </div>
              </div>

              {!pg.isApproved ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  This listing is still pending admin approval and will appear publicly after it is approved.
                </div>
              ) : null}

              {editingId === pg._id ? (
                <div className="space-y-5 rounded-3xl bg-ink-50 p-6">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Title"><TextInput name="title" value={editForm.title} onChange={handleEditChange} /></FormField>
                    <FormField label="Price"><TextInput name="price" type="number" value={editForm.price} onChange={handleEditChange} /></FormField>
                    <FormField label="Location"><TextInput name="location" value={editForm.location} onChange={handleEditChange} /></FormField>
                    <FormField label="City"><TextInput name="city" value={editForm.city} onChange={handleEditChange} /></FormField>
                    <FormField label="Address"><TextInput name="address" value={editForm.address} onChange={handleEditChange} /></FormField>
                    <FormField label="Gender">
                      <SelectInput name="gender" value={editForm.gender} onChange={handleEditChange}>
                        <option value="unisex">Unisex</option>
                        <option value="male">Boys</option>
                        <option value="female">Girls</option>
                      </SelectInput>
                    </FormField>
                    <FormField label="Room Type">
                      <SelectInput name="roomType" value={editForm.roomType} onChange={handleEditChange}>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="shared">Shared</option>
                      </SelectInput>
                    </FormField>
                    <FormField label="Total Rooms"><TextInput name="totalRooms" type="number" value={editForm.totalRooms} onChange={handleEditChange} /></FormField>
                    <FormField label="Available Rooms"><TextInput name="availableRooms" type="number" value={editForm.availableRooms} onChange={handleEditChange} /></FormField>
                  </div>
                  <FormField label="Description"><TextArea name="description" rows="3" value={editForm.description} onChange={handleEditChange} /></FormField>
                  <FormField label="Amenities"><TextInput name="amenities" value={editForm.amenities} onChange={handleEditChange} placeholder="Wi-Fi, Laundry, Meals" /></FormField>
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-3xl border border-dashed border-ink-300 bg-white px-6 py-6 text-sm font-medium text-ink-600">
                    <ImagePlus size={18} />
                    Replace images
                    <input type="file" accept="image/*" multiple onChange={handleEditImages} hidden />
                  </label>
                  {editForm.images.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {editForm.images.map((image, index) => (
                        <img key={`${index}-${image.slice(0, 32)}`} src={image} alt={`Preview ${index + 1}`} className="h-40 w-full rounded-2xl object-cover" />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn-primary" onClick={saveEdit}>Save Changes</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId("")}>Cancel</button>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-ink-500">Bookings</p>
                <div className="mt-4 space-y-4">
                  {bookingsByPg.get(pg._id)?.length ? (
                    bookingsByPg.get(pg._id).map((booking) => (
                      <div key={booking._id} className="flex items-start justify-between gap-4 rounded-2xl bg-ink-50 p-4">
                        <div>
                          <p className="font-semibold text-ink-900">{booking.user?.username || booking.user?.email || "Resident"}</p>
                          <p className="mt-1 text-sm text-ink-500">{booking.user?.phone || booking.user?.email || "No contact info"}</p>
                        </div>
                        <p className="text-sm font-semibold text-ink-900">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="muted-note">No bookings for this PG yet.</p>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PageSection>
  );
}

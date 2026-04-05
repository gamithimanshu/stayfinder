import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { normalizeListing } from "../utils/pg";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { FormField, InfoBanner, SelectInput, SurfaceCard, TextArea, TextInput } from "../components/ui.jsx";

const toArray = (value) => (Array.isArray(value) ? value : []);
const toCsv = (value) => toArray(value).map((item) => String(item ?? "").trim()).filter(Boolean).join(", ");
const normalizeOwnerPg = (value = {}) => ({ ...value, ...normalizeListing(value) });
const normalizeOwnerBooking = (booking = {}) => ({
  ...booking,
  user: booking.user ?? booking.userId ?? {},
  pg: booking.pg ?? booking.pgId ?? {},
});
const getResidentLabel = (user = {}) => user?.username || user?.name || user?.email || "Resident";
const formatBookingDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN");
};

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
    Array.from(files || []).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Unable to read image"));
          reader.readAsDataURL(file);
        })
    )
  );

const buildOwnerPgPayload = (editForm, totalRooms, availableRooms, price) => ({
  ...editForm,
  area: editForm.location,
  address: editForm.address || editForm.location,
  totalRooms,
  images: toArray(editForm.images).filter(Boolean),
  amenities: String(editForm.amenities || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  price,
  availableRooms,
});

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
          setPgs(toArray(pgData?.pgs).map(normalizeOwnerPg));
          setBookings(toArray(bookingData?.bookings).map(normalizeOwnerBooking));
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
    toArray(bookings).forEach((booking) => {
      const pgId = booking.pg?._id;
      if (!pgId) return;
      const existing = map.get(pgId) ?? [];
      existing.push(booking);
      map.set(pgId, existing);
    });
    return map;
  }, [bookings]);

  const startEdit = (pg) => {
    const normalizedPg = normalizeOwnerPg(pg);

    setEditingId(pg._id);
    setEditForm({
      title: normalizedPg.title,
      price: String(normalizedPg.price ?? ""),
      location: normalizedPg.location,
      city: normalizedPg.city,
      address: pg.address ?? normalizedPg.location ?? "",
      gender: normalizedPg.gender,
      roomType: normalizedPg.roomType ?? "single",
      totalRooms: String(pg.totalRooms ?? normalizedPg.totalRooms ?? normalizedPg.availableRooms ?? 0),
      availableRooms: String(normalizedPg.availableRooms ?? 0),
      description: normalizedPg.description ?? "",
      amenities: toCsv(normalizedPg.amenities),
      images: toArray(normalizedPg.images).filter(Boolean),
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditImages = async (event) => {
    try {
      const images = await readFilesAsDataUrls(event.target.files);
      setEditForm((current) => ({ ...current, images: toArray(images).filter(Boolean) }));
      setMessage("");
    } catch {
      setMessageType("error");
      setMessage("Some images could not be loaded.");
    }
  };

  const saveEdit = async () => {
    setMessage("");
    setMessageType("info");

    const totalRooms = Number(editForm.totalRooms);
    const availableRooms = Number(editForm.availableRooms);
    const price = Number(editForm.price);

    if (!editingId) {
      setMessageType("error");
      setMessage("Select a PG before saving changes.");
      return;
    }

    if (!editForm.title.trim() || !editForm.city.trim() || !(editForm.address || editForm.location).trim()) {
      setMessageType("error");
      setMessage("Title, city, and address are required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessageType("error");
      setMessage("Enter a valid monthly price.");
      return;
    }

    if (!Number.isInteger(totalRooms) || totalRooms < 1) {
      setMessageType("error");
      setMessage("Total rooms must be at least 1.");
      return;
    }

    if (!Number.isInteger(availableRooms) || availableRooms < 0 || availableRooms > totalRooms) {
      setMessageType("error");
      setMessage("Available rooms must be between 0 and the total room count.");
      return;
    }

    try {
      const { data } = await API.put(
        `/owner/pgs/${editingId}`,
        buildOwnerPgPayload(editForm, totalRooms, availableRooms, price)
      );

      setPgs((current) => toArray(current).map((pg) => (pg._id === editingId ? normalizeOwnerPg(data?.pg) : pg)));
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
      const { data } = await API.delete(`/owner/pgs/${pgId}`);

      setPgs((current) => toArray(current).filter((pg) => pg._id !== pgId));
      setBookings((current) => toArray(current).filter((booking) => booking.pg?._id !== pgId));
      setMessageType("success");
      setMessage(data.message || "PG deleted successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.response?.data?.message || "Unable to delete PG");
    }
  };

  if (!token || !isOwner) return null;

  if (loading) {
    return (
      <DashboardLayout
        role="owner"
        kicker="Owner workspace"
        title="Manage PGs"
        description="Loading your listings..."
      >
        <SurfaceCard className="rounded-xl border border-black/5 bg-white/85 p-10 text-center text-ink-500">
          Loading your PG listings...
        </SurfaceCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="owner"
      kicker="Owner workspace"
      title="Manage PGs"
      description="Everything for your existing properties is available here in one management space."
    >
      {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"}>{message}</InfoBanner> : null}

      <div className="space-y-6">
        {toArray(pgs).length === 0 ? (
          <SurfaceCard className="p-8">
            <h2 className="panel-title">No PGs yet</h2>
            <p className="mt-3 muted-note">Your listings will appear here once you add one.</p>
          </SurfaceCard>
        ) : null}

        {(Array.isArray(pgs) ? pgs : []).map((pg) => {
          const pgBookings = Array.isArray(bookingsByPg.get(pg._id)) ? bookingsByPg.get(pg._id) : [];

          return (
            <SurfaceCard key={pg._id} className="space-y-6 p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-500">PG listing</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink-900">{pg.title}</h2>
                  <p className="mt-2 text-sm text-ink-500">{pg.location}</p>
                  <div className="mt-3">
                    <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${
                      pg.isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {pg.isApproved ? "Approved" : "Waiting for approval"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(pg)}>
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => deletePg(pg._id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>

              {!pg.isApproved ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  This listing is still pending admin approval and will appear publicly after it is approved.
                </div>
              ) : null}

              {editingId === pg._id ? (
                <div className="space-y-5 rounded-xl bg-ink-50 p-6">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Title">
                      <TextInput name="title" value={editForm.title} onChange={handleEditChange} />
                    </FormField>
                    <FormField label="Price">
                      <TextInput name="price" type="number" value={editForm.price} onChange={handleEditChange} />
                    </FormField>
                    <FormField label="Location">
                      <TextInput name="location" value={editForm.location} onChange={handleEditChange} />
                    </FormField>
                    <FormField label="City">
                      <TextInput name="city" value={editForm.city} onChange={handleEditChange} />
                    </FormField>
                    <FormField label="Address">
                      <TextInput name="address" value={editForm.address} onChange={handleEditChange} />
                    </FormField>
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
                    <FormField label="Total Rooms">
                      <TextInput name="totalRooms" type="number" value={editForm.totalRooms} onChange={handleEditChange} />
                    </FormField>
                    <FormField label="Available Rooms">
                      <TextInput
                        name="availableRooms"
                        type="number"
                        value={editForm.availableRooms}
                        onChange={handleEditChange}
                      />
                    </FormField>
                  </div>
                  <FormField label="Description">
                    <TextArea name="description" rows="3" value={editForm.description} onChange={handleEditChange} />
                  </FormField>
                  <FormField label="Amenities">
                    <TextInput
                      name="amenities"
                      value={editForm.amenities}
                      onChange={handleEditChange}
                      placeholder="Wi-Fi, Laundry, Meals"
                    />
                  </FormField>
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-ink-300 bg-white px-6 py-6 text-sm font-medium text-ink-600">
                    <ImagePlus size={18} />
                    Replace images
                    <input type="file" accept="image/*" multiple onChange={handleEditImages} hidden />
                  </label>
                  {toArray(editForm.images).length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {toArray(editForm.images).map((image, index) => (
                        <img
                          key={`${index}-${String(image).slice(0, 32)}`}
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="h-28 w-full rounded-xl object-cover sm:h-32 xl:h-36"
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn-primary" onClick={saveEdit}>
                      Save Changes
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId("")}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-ink-500">Bookings</p>
                <div className="mt-4 space-y-4">
                  {pgBookings.length ? (
                    pgBookings.map((booking) => (
                      <div key={booking._id} className="flex items-start justify-between gap-4 rounded-xl bg-ink-50 p-4">
                        <div>
                          <p className="font-semibold text-ink-900">{getResidentLabel(booking.user)}</p>
                          <p className="mt-1 text-sm text-ink-500">{booking.user?.phone || booking.user?.email || "No contact info"}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${
                              booking.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : booking.paymentStatus === "failed"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}>
                              Payment: {booking.paymentStatus}
                            </span>
                            <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${
                              booking.bookingStatus === "cancelled"
                                ? "bg-rose-100 text-rose-700"
                                : booking.bookingStatus === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-sky-100 text-sky-700"
                            }`}>
                              Booking: {booking.bookingStatus}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-ink-900">{formatBookingDate(booking.checkInDate)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="muted-note">No bookings for this PG yet.</p>
                  )}
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}



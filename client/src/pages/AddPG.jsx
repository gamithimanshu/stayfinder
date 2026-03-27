import { useEffect, useMemo, useState } from "react";
import { ImagePlus, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { FormField, InfoBanner, SelectInput, SurfaceCard, TextArea, TextInput } from "../components/ui.jsx";

const MotionForm = motion.form;
const toArray = (value) => (Array.isArray(value) ? value : []);

const initialForm = {
  title: "",
  price: "",
  location: "",
  city: "",
  address: "",
  gender: "unisex",
  roomType: "single",
  totalRooms: "1",
  availableRooms: "1",
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

export function AddPG() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin" || Boolean(user?.isAdmin);
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isOwner) {
      navigate("/", { replace: true });
    }
  }, [isOwner, location.pathname, navigate, token, user]);

  const amenities = useMemo(
    () => String(formData.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
    [formData.amenities]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (message) {
      setMessage("");
      setMessageTone("info");
    }
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleImages = async (event) => {
    try {
      const images = await readFilesAsDataUrls(event.target.files);
      setFormData((current) => ({ ...current, images }));
      setMessage("");
      setMessageTone("info");
    } catch {
      setMessageTone("error");
      setMessage("Some images could not be loaded.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isOwner) {
      setMessageTone("error");
      setMessage("Only owner accounts can create listings.");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageTone("info");

    try {
      const { data } = await API.post("/owner/pgs", {
          ...formData,
          area: formData.location,
          address: formData.address || formData.location,
          totalRooms: Number(formData.totalRooms),
          images: formData.images,
          amenities,
          price: Number(formData.price),
          availableRooms: Number(formData.availableRooms),
      });

      navigate("/owner/manage", {
        replace: true,
        state: {
          flashMessage: data.message || "PG submitted successfully and is waiting for admin approval.",
          flashTone: "success",
        },
      });
    } catch (requestError) {
      setMessageTone("error");
      setMessage(requestError?.response?.data?.message || "Unable to create PG");
    } finally {
      setSaving(false);
    }
  };

  if (!token || !isOwner) {
    return null;
  }

  return (
    <DashboardLayout
      role="owner"
      kicker="Owner workspace"
      title="Add PG"
      description="Fill in the details below and publish a listing that feels complete and trustworthy."
    >
      {message ? <InfoBanner tone={messageTone}>{message}</InfoBanner> : null}
      <MotionForm
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <SurfaceCard className="space-y-6 p-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Title"><TextInput name="title" value={formData.title} onChange={handleChange} required /></FormField>
              <FormField label="Price"><TextInput name="price" type="number" min="0" value={formData.price} onChange={handleChange} required /></FormField>
              <FormField label="Location"><TextInput name="location" value={formData.location} onChange={handleChange} required /></FormField>
              <FormField label="City"><TextInput name="city" value={formData.city} onChange={handleChange} required /></FormField>
              <FormField label="Address"><TextInput name="address" value={formData.address} onChange={handleChange} placeholder="Full address" required /></FormField>
              <FormField label="Gender">
                <SelectInput name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="unisex">Unisex</option>
                  <option value="male">Boys</option>
                  <option value="female">Girls</option>
                </SelectInput>
              </FormField>
              <FormField label="Room Type">
                <SelectInput name="roomType" value={formData.roomType} onChange={handleChange}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="shared">Shared</option>
                </SelectInput>
              </FormField>
              <FormField label="Total Rooms"><TextInput name="totalRooms" type="number" min="1" value={formData.totalRooms} onChange={handleChange} required /></FormField>
              <FormField label="Available Rooms"><TextInput name="availableRooms" type="number" min="0" value={formData.availableRooms} onChange={handleChange} required /></FormField>
            </div>

            <FormField label="Description"><TextArea name="description" value={formData.description} onChange={handleChange} rows="4" /></FormField>
            <FormField label="Amenities" hint="Comma separated"><TextInput name="amenities" value={formData.amenities} onChange={handleChange} placeholder="Wi-Fi, Laundry, Meals" /></FormField>

            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-6 py-8 text-sm font-medium text-ink-600">
              <ImagePlus size={20} />
              Upload images
              <input type="file" accept="image/*" multiple onChange={handleImages} hidden />
            </label>

            {toArray(formData.images).length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {toArray(formData.images).map((image, index) => (
                  <img key={`${index}-${String(image).slice(0, 32)}`} src={image} alt={`Preview ${index + 1}`} className="h-40 w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : null}

            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities.map((item) => <span key={item} className="badge-soft">{item}</span>)}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              <PlusCircle size={18} />
              {saving ? "Saving..." : "Create PG"}
            </button>
          </SurfaceCard>
      </MotionForm>
    </DashboardLayout>
  );
}



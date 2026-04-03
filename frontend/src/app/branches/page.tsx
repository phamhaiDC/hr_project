'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner, Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organization.service';
import type { Branch } from '@/types';

// ─── Coordinate validation helpers ───────────────────────────────────────────

function parseLat(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return isNaN(n) || n < -90 || n > 90 ? null : n;
}

function parseLng(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return isNaN(n) || n < -180 || n > 180 ? null : n;
}

// ─── Branch modal (create + edit) ────────────────────────────────────────────

interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  branch: Branch | null; // null → create mode
  onSuccess: () => void;
}

interface FormState {
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = { name: '', latitude: '', longitude: '', radius: '50' };

function BranchModal({ open, onClose, branch, onSuccess }: BranchModalProps) {
  const isEdit = branch !== null;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Populate or reset form when modal opens
  useEffect(() => {
    if (!open) return;
    setApiError('');
    setErrors({});
    if (branch) {
      setForm({
        name:      branch.name,
        latitude:  branch.latitude  != null ? String(branch.latitude)  : '',
        longitude: branch.longitude != null ? String(branch.longitude) : '',
        radius:    String(branch.radius ?? 50),
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, branch]);

  function setField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.name.trim()) {
      errs.name = 'Branch name is required';
    }

    const hasLat = form.latitude.trim() !== '';
    const hasLng = form.longitude.trim() !== '';

    if (hasLat && parseLat(form.latitude) === null) {
      errs.latitude = 'Must be a number between -90 and 90';
    }
    if (hasLng && parseLng(form.longitude) === null) {
      errs.longitude = 'Must be a number between -180 and 180';
    }
    // Coordinates must be paired — one without the other is invalid
    if (hasLat && !hasLng) errs.longitude = 'Required when latitude is set';
    if (hasLng && !hasLat) errs.latitude = 'Required when longitude is set';

    const r = Number(form.radius);
    if (!form.radius.trim() || isNaN(r) || r <= 0) {
      errs.radius = 'Must be a positive number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setApiError('');
    setSaving(true);
    try {
      const lat = parseLat(form.latitude);
      const lng = parseLng(form.longitude);
      const payload = {
        name:      form.name.trim(),
        latitude:  lat ?? undefined,
        longitude: lng ?? undefined,
        radius:    Number(form.radius),
      };
      if (isEdit) {
        await organizationService.updateBranch(branch!.id, payload);
      } else {
        await organizationService.createBranch(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setApiError(Array.isArray(raw) ? raw[0] : (raw ?? 'Failed to save branch'));
    } finally {
      setSaving(false);
    }
  }

  function handleUseGps() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField('latitude',  pos.coords.latitude.toFixed(6));
        setField('longitude', pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  // Map preview — shown only when both coordinates are valid
  const lat = parseLat(form.latitude);
  const lng = parseLng(form.longitude);
  const showMap = lat !== null && lng !== null;
  const delta = 0.006;
  const mapSrc = showMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Branch' : 'Add Branch'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="branch-form" type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Branch'}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
        {apiError && <Alert message={apiError} />}

        {/* Name */}
        <Input
          label="Branch Name *"
          placeholder="e.g. Ho Chi Minh City Branch"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
        />

        <hr className="border-gray-100" />

        {/* GPS */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              GPS Location
              <span className="ml-1 font-normal normal-case text-gray-400">— optional</span>
            </legend>
            <button
              type="button"
              onClick={handleUseGps}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {gpsLoading ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              Use my GPS
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              placeholder="−90 to 90  (e.g. 10.7719)"
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              error={errors.latitude}
            />
            <Input
              label="Longitude"
              placeholder="−180 to 180  (e.g. 106.7042)"
              value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              error={errors.longitude}
            />
          </div>

          <Input
            label="Geofence Radius (metres) *"
            type="number"
            min={1}
            placeholder="50"
            value={form.radius}
            onChange={(e) => setField('radius', e.target.value)}
            error={errors.radius}
          />

          {/* Location preview */}
          {showMap ? (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">Location preview — read-only</p>
              <iframe
                src={mapSrc}
                className="h-48 w-full rounded-xl border border-gray-200"
                loading="lazy"
                title="Branch location preview"
              />
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
              Enter coordinates above or tap "Use my GPS" to preview the location
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}

// ─── GPS badge shown in table rows ───────────────────────────────────────────

function GpsBadge({ branch }: { branch: Branch }) {
  const hasGps = branch.latitude != null && branch.longitude != null;

  if (!hasGps) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        No GPS
      </span>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="font-mono text-xs text-gray-700">
        {branch.latitude!.toFixed(5)}, {branch.longitude!.toFixed(5)}
      </p>
      <a
        href={`https://www.openstreetmap.org/?mlat=${branch.latitude}&mlon=${branch.longitude}#map=16/${branch.latitude}/${branch.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-indigo-500 hover:underline"
      >
        View on map ↗
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBranches(await organizationService.branches());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(b: Branch) {
    setEditTarget(b);
    setModalOpen(true);
  }

  function handleSuccess() {
    setModalOpen(false);
    load();
  }

  const colCount = isAdmin ? 5 : 4;

  return (
    <AppShell title="Branches">
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? '…' : `${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
          </p>
          {isAdmin && (
            <Button onClick={openCreate}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Branch
            </Button>
          )}
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-800">All Branches</h3>
          </div>

          {loading ? (
            <PageSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Coordinates</th>
                    <th className="px-6 py-3 text-left">Radius</th>
                    <th className="px-6 py-3 text-left">Employees</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {branches.map((b) => (
                    <tr key={b.id} className="group hover:bg-gray-50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                            <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{b.name}</p>
                            <p className="text-xs text-gray-400">ID #{b.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td className="px-6 py-4">
                        <GpsBadge branch={b} />
                      </td>

                      {/* Radius */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {b.radius ?? 50} m
                        </span>
                      </td>

                      {/* Employee count */}
                      <td className="px-6 py-4 text-gray-500">
                        {b._count?.employees ?? '—'}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                            Edit
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={colCount} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <svg className="h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">No branches yet</p>
                            <p className="text-xs">
                              {isAdmin ? 'Add a branch to get started.' : 'No branches have been configured.'}
                            </p>
                          </div>
                          {isAdmin && (
                            <Button size="sm" onClick={openCreate}>Add first branch</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BranchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        branch={editTarget}
        onSuccess={handleSuccess}
      />
    </AppShell>
  );
}

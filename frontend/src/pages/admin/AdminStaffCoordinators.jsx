import React, { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import BackButton from "../../components/BackButton";
import Card from "../../components/ui/Card";

export default function AdminStaffCoordinators() {
	const [mappings, setMappings] = useState([]);
	const [staffList, setStaffList] = useState([]);
	const [activityTypes, setActivityTypes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [query, setQuery] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [activityType, setActivityType] = useState("");
	const [staffId, setStaffId] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const load = async () => {
		setLoading(true);
		setError(null);
		try {
			const [mapRes, staffRes, typesRes] = await Promise.all([
				apiClient.get("/activity-coordinators"),
				apiClient.get("/admin/users"),
				apiClient.get("/activity-coordinators/types"),
			]);
			const maps = mapRes.mappings || mapRes || [];
			const staff = (staffRes.users || []).filter(
				(u) => u.role === "staff" || u.role === "admin"
			);
			const types = typesRes.activityTypes || typesRes || [];
			setMappings(maps);
			setStaffList(staff);
			setActivityTypes(types);
		} catch (e) {
			setError(e.message || "Failed to load data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const handleAdd = async () => {
		if (!activityType.trim() || !staffId) {
			setError("Please provide activity type and staff member");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await apiClient.post("/activity-coordinators", {
				activityType: activityType.trim(),
				staffId: Number(staffId),
			});
			setSuccess("Coordinator added");
			setShowModal(false);
			setActivityType("");
			setStaffId("");
			await load();
			setTimeout(() => setSuccess(null), 2000);
		} catch (e) {
			setError(e.message || "Failed to add coordinator");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Remove this coordinator?")) return;
		try {
			await apiClient.delete(`/activity-coordinators/${id}`);
			setSuccess("Coordinator removed");
			await load();
			setTimeout(() => setSuccess(null), 2000);
		} catch (e) {
			setError(e.message || "Failed to remove coordinator");
		}
	};

	const filtered = mappings.filter((m) => {
		if (!query) return true;
		const q = query.toLowerCase();
		return (
			(m.activity_type || "").toLowerCase().includes(q) ||
			(m.staff_name || "").toLowerCase().includes(q) ||
			(m.staff_email || "").toLowerCase().includes(q)
		);
	});

	return (
		<div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10">
			<div className="mx-auto max-w-6xl px-6">
				<BackButton />
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
						Activity Coordinators
					</h1>
					<p className="text-slate-600 dark:text-slate-300">
						Map staff to achievement/project activity types (e.g., hackathon, paper presentation, coding competition).
					</p>
				</div>

				{error && (
					<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
						{error}
					</div>
				)}
				{success && (
					<div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300">
						{success}
					</div>
				)}

				<div className="mb-6 flex flex-wrap items-end gap-3">
					<div className="flex-1 min-w-[200px]">
						<label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
							Search by activity or staff
						</label>
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Hackathon, Paper, Staff name/email"
							className="w-full rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
						/>
					</div>
					{query && (
						<button
							onClick={() => setQuery("")}
							className="rounded-md px-3 py-2 text-sm border bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
						>
							Reset
						</button>
					)}
					<button
						onClick={() => setShowModal(true)}
						className="btn btn-primary btn-sm"
					>
						+ Add Coordinator
					</button>
					<button
						onClick={load}
						disabled={loading}
						className="rounded-md px-4 py-2 text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 disabled:opacity-50"
					>
						{loading ? "Refreshing..." : "Refresh"}
					</button>
				</div>

				{loading && !mappings.length ? (
					<div className="text-center py-8 text-slate-600 dark:text-slate-400">
						Loading coordinators...
					</div>
				) : filtered.length === 0 ? (
					<Card className="p-8 text-center">
						<p className="text-slate-600 dark:text-slate-400">
							{mappings.length === 0
								? "No coordinators assigned yet. Click 'Add Coordinator' to get started."
								: "No matches found for your search."}
						</p>
					</Card>
				) : (
					<div className="grid gap-3">
						{filtered.map((m) => (
							<Card key={m.id} className="p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
											{m.activity_type || "(unspecified)"}
										</p>
										<p className="text-xs text-slate-600 dark:text-slate-400">
											{m.staff_name} ({m.staff_email})
										</p>
									</div>
									<button
										onClick={() => handleDelete(m.id)}
										className="rounded-md px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
									>
										Remove
									</button>
								</div>
							</Card>
						))}
					</div>
				)}

				{showModal && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md">
							<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
								Assign Activity Coordinator
							</h2>

							<div className="mb-4">
								<label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Activity Type
								</label>
								<div className="flex gap-2">
									<select
										value={activityType}
										onChange={(e) => setActivityType(e.target.value)}
										className="flex-1 rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
									>
										<option value="">Select activity</option>
										{activityTypes.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
										<option value="__custom">+ Custom</option>
									</select>
								</div>
								{activityType === "__custom" && (
									<input
										autoFocus
										onChange={(e) => setActivityType(e.target.value)}
										placeholder="Type a new activity"
										className="mt-2 w-full rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
									/>
								)}
							</div>

							<div className="mb-6">
								<label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Staff Member
								</label>
								<select
									value={staffId}
									onChange={(e) => setStaffId(e.target.value)}
									className="w-full rounded border px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
								>
									<option value="">Select staff</option>
									{staffList.map((s) => (
										<option key={s.id} value={s.id}>
											{s.full_name} ({s.email})
										</option>
									))}
								</select>
							</div>

							<div className="flex gap-3">
								<button
									onClick={() => {
										setShowModal(false);
										setActivityType("");
										setStaffId("");
										setError(null);
									}}
									className="flex-1 rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700"
								>
									Cancel
								</button>
								<button
									onClick={handleAdd}
									disabled={submitting || !activityType.trim() || !staffId}
									className="flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
								>
									{submitting ? "Adding..." : "Add"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

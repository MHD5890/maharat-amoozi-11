
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Trash2, Edit, Eye, X, Database, Plus, Filter, Bell, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Clean admin panel implementing user's requirements:
// - No month/year selectors
// - Global skill list (add / edit / delete)
// - National ID search box to filter persons
// - Persons / Exam tabs
// - Export buttons (full and per-skill)

type Person = any;

function InlineSkillEditor({ item, onDelete, onUpdate, count, onClick }: { item: any; onDelete: () => void; onUpdate: (newName: string) => void; count: number; onClick: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item?.skill || "");
  useEffect(() => setValue(item?.skill || ""), [item?.skill]);
  return (
    <div className="flex items-center gap-2">
      {!editing ? (
        <>
          <button className="text-sm text-blue-600 hover:underline" onClick={onClick}>{item?.skill}</button> ({count})
          <button className="text-sky-600 text-sm" onClick={() => setEditing(true)}>ویرایش</button>
          <button className="text-red-500 text-sm" onClick={onDelete}>حذف</button>
        </>
      ) : (
        <>
          <input className="px-2 py-1 border rounded-md text-sm" value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="text-emerald-600 text-sm" onClick={() => { if (value.trim()) { onUpdate(value.trim()); setEditing(false); } }}>ذخیره</button>
          <button className="text-gray-600 text-sm" onClick={() => { setValue(item?.skill || ""); setEditing(false); }}>لغو</button>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'persons' | 'mehta' | 'exam' | 'announcements'>('persons');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [persons, setPersons] = useState<Person[]>([]);

  const [search, setSearch] = useState<string>(''); // fuzzy search
  const [nationalIdSearch, setNationalIdSearch] = useState<string>(''); // strict contains on nationalId

  const [allSkillOffers, setAllSkillOffers] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState<string>('');

  const [allMehtaSkills, setAllMehtaSkills] = useState<any[]>([]);
  const [newMehtaSkillName, setNewMehtaSkillName] = useState<string>('');

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState<string>('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState<string>('');
  const [newAnnouncementImage, setNewAnnouncementImage] = useState<File | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);

  const [sidebarTab, setSidebarTab] = useState<'skills' | 'mehta-skills' | 'announcements'>('skills');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const [examIntros, setExamIntros] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastLoginTime, setLastLoginTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);


  // auth guard
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    const adminPass = sessionStorage.getItem('admin_pass');
    if (adminAuth !== 'true' || !adminPass) {
      window.location.href = '/login';
    }
  }, []);

  // load persons
  useEffect(() => {
    (async () => {
      try {
        const adminPass = sessionStorage.getItem('admin_pass') || '';
        const res = await fetch(`/api/persons?pass=${encodeURIComponent(adminPass)}`);
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.success) {
          const newPersons = body.data || [];
          setPersons(newPersons);

          // Check for new registrations since last login
          const lastLogin = localStorage.getItem('admin_last_login');
          if (lastLogin) {
            const lastLoginDate = new Date(lastLogin);
            const newRegistrations = newPersons.filter((p: any) => new Date(p.createdAt) > lastLoginDate);
            if (newRegistrations.length > 0) {
              const notifs = newRegistrations.map((p: any) => ({
                id: p._id,
                type: 'registration',
                message: `کاربر ${p.firstName} ${p.lastName} در دوره ${p.skillField || 'نامشخص'} ثبت نام کرده است.`,
                timestamp: new Date(p.createdAt),
              }));
              setNotifications(notifs);
            }
          }
          // Update last login time
          const now = new Date().toISOString();
          localStorage.setItem('admin_last_login', now);
          setLastLoginTime(now);
        }
      } catch (e: any) { setStatusMessage(e?.message || 'خطا در بارگذاری افراد'); }
    })();
  }, []);

  // load exam intros
  useEffect(() => {
    (async () => {
      try {
        const adminPass = sessionStorage.getItem('admin_pass') || '';
        const res = await fetch(`/api/examintro?pass=${encodeURIComponent(adminPass)}`);
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.success) setExamIntros(body.data || []);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  // load skills
  const loadAllSkillOffers = async () => {
    try {
      const res = await fetch('/api/skill-offers');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setAllSkillOffers(body.data || []);
      else setAllSkillOffers([]);
    } catch (e) { setAllSkillOffers([]); }
  };
  useEffect(() => { loadAllSkillOffers(); }, []);

  const loadAllMehtaSkills = async () => {
    try {
      const res = await fetch('/api/mehta-skills');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setAllMehtaSkills(body.data || []);
      else setAllMehtaSkills([]);
    } catch (e) { setAllMehtaSkills([]); }
  };
  useEffect(() => { loadAllMehtaSkills(); }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setAnnouncements(body.data || []);
      else setAnnouncements([]);
    } catch (e) { setAnnouncements([]); }
  };
  useEffect(() => { loadAnnouncements(); }, []);


  // skill operations
  const addSkillOffer = async () => {
    if (!newSkillName.trim()) { setStatusMessage('نام رشته الزامی است'); return; }
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/skill-offers?pass=${encodeURIComponent(adminPass)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: newSkillName.trim() }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { setNewSkillName(''); await loadAllSkillOffers(); setStatusMessage('رشته اضافه شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در افزودن رشته'); }
  };

  const deleteSkillOffer = async (id: string) => {
    if (!confirm('آیا حذف شود؟')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/skill-offers/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' });
      if (res.ok) { await loadAllSkillOffers(); setStatusMessage('رشته حذف شد'); }
      else { const body = await res.json().catch(() => ({})); setStatusMessage(body.message || `خطا (${res.status})`); }
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در حذف رشته'); }
  };

  const updateSkillOffer = async (id: string, newName: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/skill-offers/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: newName }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { await loadAllSkillOffers(); setStatusMessage('رشته بروزرسانی شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در ویرایش رشته'); }
  };

  // person operations
  const deletePerson = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { setPersons(prev => prev.filter(p => p._id !== id)); setStatusMessage('رکورد حذف شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در حذف'); }
  };

  const updatePersonStatus = async (id: string, newStatus: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ status: newStatus })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
        setStatusMessage('وضعیت بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی وضعیت');
    }
  };

  const updatePersonExamDate = async (id: string, examDate: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ examDate })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, examDate } : p));
        setStatusMessage('تاریخ آزمون بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی تاریخ آزمون');
    }
  };

  const updatePersonSkillAndPeriod = async (id: string, skillField: string, courseMonth: string, courseYear: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ skillField, courseMonth, courseYear })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, skillField, courseMonth, courseYear } : p));
        setStatusMessage('رشته و دوره بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی رشته و دوره');
    }
  };

  const updatePersonSkillField = async (id: string, skillField: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ skillField })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, skillField } : p));
        setStatusMessage('رشته بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی رشته');
    }
  };

  const updatePersonCourseMonth = async (id: string, courseMonth: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ courseMonth })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, courseMonth } : p));
        setStatusMessage('ماه دوره بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی ماه دوره');
    }
  };

  const updatePersonCourseYear = async (id: string, courseYear: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body: new URLSearchParams({ courseYear })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPersons(prev => prev.map(p => p._id === id ? { ...p, courseYear } : p));
        setStatusMessage('سال دوره بروزرسانی شد');
      } else {
        setStatusMessage(body.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی سال دوره');
    }
  };

  // Mehta skills operations
  const addMehtaSkill = async () => {
    if (!newMehtaSkillName.trim()) { setStatusMessage('نام رشته الزامی است'); return; }
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/mehta-skills?pass=${encodeURIComponent(adminPass)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: newMehtaSkillName.trim() }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { setNewMehtaSkillName(''); await loadAllMehtaSkills(); setStatusMessage('رشته مهتا اضافه شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در افزودن رشته مهتا'); }
  };

  const deleteMehtaSkill = async (id: string) => {
    if (!confirm('آیا حذف شود؟')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/mehta-skills/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' });
      if (res.ok) { await loadAllMehtaSkills(); setStatusMessage('رشته مهتا حذف شد'); }
      else { const body = await res.json().catch(() => ({})); setStatusMessage(body.message || `خطا (${res.status})`); }
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در حذف رشته مهتا'); }
  };

  const updateMehtaSkill = async (id: string, newName: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/mehta-skills/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: newName }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { await loadAllMehtaSkills(); setStatusMessage('رشته مهتا بروزرسانی شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در ویرایش رشته مهتا'); }
  };

  // Announcements operations
  const addAnnouncement = async () => {
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) { setStatusMessage('عنوان و محتوا الزامی است'); return; }
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const formData = new FormData();
      formData.append('title', newAnnouncementTitle.trim());
      formData.append('content', newAnnouncementContent.trim());
      if (newAnnouncementImage) formData.append('image', newAnnouncementImage);
      const res = await fetch(`/api/announcements?pass=${encodeURIComponent(adminPass)}`, { method: 'POST', body: formData });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { setNewAnnouncementTitle(''); setNewAnnouncementContent(''); setNewAnnouncementImage(null); await loadAnnouncements(); setStatusMessage('اطلاعیه اضافه شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در افزودن اطلاعیه'); }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('آیا حذف شود؟')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/announcements/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' });
      if (res.ok) { await loadAnnouncements(); setStatusMessage('اطلاعیه حذف شد'); }
      else { const body = await res.json().catch(() => ({})); setStatusMessage(body.message || `خطا (${res.status})`); }
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در حذف اطلاعیه'); }
  };

  const updateAnnouncement = async (id: string, title: string, content: string, image?: File) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) formData.append('image', image);
      const res = await fetch(`/api/announcements/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'PUT', body: formData });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) { await loadAnnouncements(); setStatusMessage('اطلاعیه بروزرسانی شد'); setEditingAnnouncement(null); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در ویرایش اطلاعیه'); }
  };


  const updateExamIntroStatus = async (id: string, newStatus: string, examDate?: string) => {
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const body = new URLSearchParams({ status: newStatus });
      if (examDate !== undefined) body.set('examDate', examDate);
      const res = await fetch(`/api/examintro/${id}?pass=${encodeURIComponent(adminPass)}`, {
        method: 'PUT',
        body
      });
      const resBody = await res.json().catch(() => ({}));
      if (res.ok && resBody.success) {
        setExamIntros(prev => prev.map(e => e._id === id ? { ...e, status: newStatus, examDate: examDate !== undefined ? examDate : e.examDate } : e));
        setStatusMessage('وضعیت بروزرسانی شد');
      } else {
        setStatusMessage(resBody.message || `خطا (${res.status})`);
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'خطا در بروزرسانی وضعیت');
    }
  };

  const deleteExamIntro = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const res = await fetch(`/api/examintro/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { setExamIntros(prev => prev.filter(e => e._id !== id)); setStatusMessage('رکورد حذف شد'); }
      else setStatusMessage(body.message || `خطا (${res.status})`);
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در حذف'); }
  };

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    persons.forEach(p => {
      const skill = p.skillField || '';
      counts[skill] = (counts[skill] || 0) + 1;
    });
    return counts;
  }, [persons]);

  const displayed = useMemo(() => {
    let items = persons.slice();
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(p => {
        return [p.firstName, p.lastName, p.fatherName, p.nationalId, p.phone, p.city, p.education, p.placeOfService, p.skillField, p.maritalStatus]
          .some(f => (f || '').toString().toLowerCase().includes(q));
      });
    }
    if (nationalIdSearch && nationalIdSearch.trim()) {
      const nid = nationalIdSearch.trim();
      items = items.filter(p => ((p.nationalId || '') + '').includes(nid));
    }
    if (selectedSkillFilter) {
      items = items.filter(p => p.skillField === selectedSkillFilter);
    }
    return items;
  }, [persons, search, nationalIdSearch, selectedSkillFilter]);

  const toggleSelect = (id: string) => setSelectedIds(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const allIds = displayed.map((p: any) => p._id);
      const allSelected = allIds.every((id: any) => prev.has(id));
      if (allSelected) return new Set<string>();
      return new Set<string>(allIds);
    });
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`آیا از حذف ${selectedIds.size} رکورد انتخاب شده مطمئن هستید؟`)) return;
    const adminPass = sessionStorage.getItem('admin_pass') || '';
    try {
      const ids = Array.from(selectedIds);
      if (activeTab === 'persons') {
        await Promise.all(ids.map(id => fetch(`/api/persons/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' })));
        setPersons(prev => prev.filter(p => !selectedIds.has(p._id)));
      } else {
        await Promise.all(ids.map(id => fetch(`/api/examintro/${id}?pass=${encodeURIComponent(adminPass)}`, { method: 'DELETE' })));
        setExamIntros(prev => prev.filter(e => !selectedIds.has(e._id)));
      }
      setSelectedIds(new Set());
      setStatusMessage('رکوردهای انتخاب‌شده حذف شدند');
    } catch (err: any) {
      setStatusMessage(err?.message || 'خطا در حذف رکوردها');
    }
  };

  const exportExcel = async (skill?: string, tab?: string) => {
    setExportingExcel(true);
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const params = new URLSearchParams();
      if (skill) params.set('skill', skill);
      if (tab) params.set('tab', tab);
      params.set('pass', adminPass);
      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) { const body = await res.json().catch(() => ({})); setStatusMessage(body.message || `خطا (${res.status})`); return; }
      const blob = await res.blob(); const u = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = `${skill ? skill.replace(/\s+/g, '_') + '_' : ''}${tab ? tab + '_' : ''}persons.xlsx`; a.click();
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در تولید اکسل'); }
    finally { setExportingExcel(false); }
  };

  const exportPhotosZip = async (skill?: string) => {
    setExportingZip(true);
    try {
      const adminPass = sessionStorage.getItem('admin_pass') || '';
      const params = new URLSearchParams();
      params.set('type', 'zip');
      if (skill) params.set('skill', skill);
      params.set('pass', adminPass);
      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) { const body = await res.json().catch(() => ({})); setStatusMessage(body.message || `خطا (${res.status})`); return; }
      const blob = await res.blob(); const u = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = `${skill ? skill.replace(/\s+/g, '_') + '_' : ''}photos.zip`; a.click();
    } catch (e: any) { setStatusMessage(e?.message || 'خطا در تولید زیپ عکس‌ها'); }
    finally { setExportingZip(false); }
  };

  const testDb = async () => {
    setStatusMessage('در حال تست اتصال دیتابیس...');
    try {
      const res = await fetch('/api/testdb');
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setStatusMessage(body.message || 'اتصال برقرار است');
      else setStatusMessage(body.message || `خطا در اتصال (${res.status})`);
    } catch (err: any) {
      setStatusMessage(err?.message || 'خطا در برقراری ارتباط با سرور');
    }
  };

  return (
    <div className="min-h-screen bg-primary-gradient p-8">
      <div className="max-w-screen-2xl mx-auto bg-white rounded-3xl p-6 shadow-2xl ring-4 ring-white/20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 relative"
        >
          <h1 className="text-3xl font-extrabold text-center text-gray-900">پنل مدیریت</h1>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-gray-100 text-gray-700 px-3 py-2 rounded-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </motion.button>
            <motion.button
              onClick={() => { sessionStorage.removeItem('admin_pass'); window.location.href = '/'; }}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              خروج
            </motion.button>
          </div>
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">اعلان‌ها</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">هیچ اعلانی وجود ندارد.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((notif: any) => (
                      <div key={notif.id} className="p-2 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.timestamp).toLocaleString('fa-IR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {statusMessage && <div className="my-3 p-3 rounded-md bg-red-50 text-red-700">{statusMessage}</div>}

        {/* Top toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4"
        >

          <input placeholder="جستجو (نام، تلفن، شهر...)" className="px-3 py-2 border rounded-md flex-1" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex items-center gap-2">
            <input placeholder="جستجو بر اساس کد ملی" className="px-3 py-2 border rounded-md" value={nationalIdSearch} onChange={(e) => setNationalIdSearch(e.target.value)} />
            {nationalIdSearch && <button className="px-3 py-2 bg-gray-200 rounded-md" onClick={() => setNationalIdSearch('')}>پاک کردن</button>}
          </div>
          <motion.button
            className="bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
            onClick={() => exportExcel()}
            disabled={exportingExcel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {exportingExcel ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4 text-green-500" />}
            خروجی اکسل کل
          </motion.button>
          <motion.button
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
            onClick={() => exportPhotosZip()}
            disabled={exportingZip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {exportingZip ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4" />}
            خروجی زیپ عکس‌ها
          </motion.button>
          <motion.button
            className="px-3 py-2 bg-sky-500 text-white rounded-md"
            onClick={testDb}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            تست DB
          </motion.button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-md p-4">
              <div className="flex gap-3 items-center mb-3">
                <motion.button
                  className={`px-4 py-2 rounded-md ${activeTab === 'persons' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('persons')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  افراد
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-md ${activeTab === 'exam' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('exam')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  معرفی به آزمون
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-md ${activeTab === 'mehta' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('mehta')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  مهتا
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'persons' && (
                  <motion.div
                    key="persons"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-slate-700 mb-2">تعداد کل: <strong>{persons.length}</strong> — نمایش: <strong>{displayed.length}</strong></div>
                    <motion.button
                      className="bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 mb-4"
                      onClick={() => exportExcel(undefined, 'persons')}
                      disabled={exportingExcel}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {exportingExcel ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4 text-green-500" />}
                      خروجی اکسل افراد
                    </motion.button>
                    {selectedIds.size > 0 && (
                      <motion.div className="mb-4">
                        <motion.button
                          className="px-3 py-2 bg-red-500 text-white rounded-md"
                          onClick={deleteSelected}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          حذف انتخاب شده ({selectedIds.size})
                        </motion.button>
                      </motion.div>
                    )}
                    {displayed.length === 0 ? <div className="p-6 text-slate-500">هیچ رکوردی یافت نشد.</div> : (
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm border-collapse bg-white shadow-lg ring-1 ring-gray-200 min-w-[600px]"
                      >
                          <thead>
                            <tr className="text-left text-sm text-indigo-700 bg-gray-50">
                              <th className="p-2"><input type="checkbox" onChange={(e) => { const ids = displayed.map(d => d._id); const all = ids.every(id => selectedIds.has(id)); if (all) setSelectedIds(new Set()); else setSelectedIds(new Set(ids)); }} checked={displayed.length > 0 && displayed.every((d: any) => selectedIds.has(d._id))} /></th>
                              <th className="p-2">ردیف</th>
                              <th className="p-2">نام</th>
                              <th className="p-2 hidden sm:table-cell">نام خانوادگی</th>
                              <th className="p-2">کد ملی</th>
                              <th className="p-2">شماره تماس</th>
                              <th className="p-2 hidden md:table-cell">رشته</th>
                              <th className="p-2">وضعیت</th>
                              <th className="p-2">عکس</th>
                              <th className="p-2">عملیات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayed.map((p: any, i: number) => (
                            <tr
                              key={p._id}
                              className="border-b"
                            >
                                <td className="p-2 text-center"><input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                                <td className="p-2">{i + 1}</td>
                                <td className="p-2">{p.firstName}</td>
                                <td className="p-2 hidden sm:table-cell">{p.lastName}</td>
                                <td className="p-2">{p.nationalId}</td>
                                <td className="p-2">{p.phone}</td>
                                <td className="p-2 hidden md:table-cell">{p.skillField}</td>
                                <td className="p-2">
                                  <select value={p.status || 'در انتظار تایید'} onChange={(e) => updatePersonStatus(p._id, e.target.value)} className="px-2 py-1 border rounded-md text-sm">
                                    <option value="در انتظار تایید">در انتظار تایید</option>
                                    <option value="ثبت نام شده">ثبت نام شده</option>
                                    <option value="معرفی به آزمون شده">معرفی به آزمون شده</option>
                                  </select>
                                  {p.status === 'معرفی به آزمون شده' && (
                                    <div className="mt-1 grid grid-cols-3 gap-1">
                                      <select value={p.examDate ? p.examDate.split('/')[0] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${ev.target.value}/${p.examDate ? p.examDate.split('/')[1] : ''}/${p.examDate ? p.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">سال</option>
                                        {Array.from({ length: 5 }, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}
                                      </select>
                                      <select value={p.examDate ? p.examDate.split('/')[1] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${p.examDate ? p.examDate.split('/')[0] : ''}/${ev.target.value}/${p.examDate ? p.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">ماه</option>
                                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                      <select value={p.examDate ? p.examDate.split('/')[2] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${p.examDate ? p.examDate.split('/')[0] : ''}/${p.examDate ? p.examDate.split('/')[1] : ''}/${ev.target.value}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">روز</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-center">{p.hasPhoto ? <img src={`/api/persons/${p._id}?photo=true&pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}&t=${Date.now()}`} alt="عکس" className="w-6 h-6 object-cover rounded mx-auto cursor-pointer" onClick={() => setSelectedPhoto(`/api/persons/${p._id}?photo=true&pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}&t=${Date.now()}`)} /> : ''}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <a href={`/?editId=${p._id}`} className="bg-sky-500 text-white px-3 py-1 rounded-full">ویرایش</a>
                                    <button className="bg-red-500 text-white px-3 py-1 rounded-full" onClick={() => deletePerson(p._id)}>حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'exam' && (
                  <motion.div
                    key="exam"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.button
                      className="bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 mb-4"
                      onClick={() => exportExcel(undefined, 'exam')}
                      disabled={exportingExcel}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {exportingExcel ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4 text-green-500" />}
                      خروجی اکسل معرفی به آزمون
                    </motion.button>
                    {selectedIds.size > 0 && (
                      <motion.div className="mb-4">
                        <motion.button
                          className="px-3 py-2 bg-red-500 text-white rounded-md"
                          onClick={deleteSelected}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          حذف انتخاب شده ({selectedIds.size})
                        </motion.button>
                      </motion.div>
                    )}
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm border-collapse bg-white shadow-lg ring-1 ring-gray-200 min-w-[600px]"
                      >
                        <thead>
                          <tr className="text-left text-sm text-indigo-700">
                            <th className="p-2 bg-gray-50"><input type="checkbox" onChange={() => { const all = examIntros.map(x => x._id); const allSelected = all.every(id => selectedIds.has(id)); if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(all)); }} checked={examIntros.length > 0 && examIntros.every(x => selectedIds.has(x._id))} /></th>
                            <th className="p-2 bg-gray-50">ردیف</th>
                            <th className="p-2 bg-gray-50">نام</th>
                            <th className="p-2 bg-gray-50 hidden sm:table-cell">نام خانوادگی</th>
                            <th className="p-2 bg-gray-50">کد ملی</th>
                            <th className="p-2 bg-gray-50">شماره تماس</th>
                            <th className="p-2 bg-gray-50 hidden md:table-cell">رشته</th>
                            <th className="p-2 bg-gray-50">ماه/سال دوره</th>
                            <th className="p-2 bg-gray-50">وضعیت</th>
                            <th className="p-2 bg-gray-50">عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examIntros.length === 0 && (<tr><td colSpan={10} className="p-6 text-center text-slate-500">هنوز معرفی به آزمون ثبت نشده است.</td></tr>)}
                          {examIntros.map((e: any, i: number) => (
                            <tr
                              key={e._id}
                              className="border-b"
                            >
                              <td className="p-2 text-center"><input type="checkbox" checked={selectedIds.has(e._id)} onChange={() => { setSelectedIds(prev => { const s = new Set(prev); if (s.has(e._id)) s.delete(e._id); else s.add(e._id); return s; }); }} /></td>
                              <td className="p-2">{i + 1}</td>
                              <td className="p-2">{e.firstName}</td>
                              <td className="p-2 hidden sm:table-cell">{e.lastName}</td>
                              <td className="p-2">{e.nationalId}</td>
                              <td className="p-2">{e.phone}</td>
                              <td className="p-2 hidden md:table-cell">{e.skillField}</td>
                              <td className="p-2">{e.courseMonth}/{e.courseYear}</td>
                              <td className="p-2">
                                <select
                                  value={e.status || 'معرفی نشده'}
                                  onChange={(ev) => updateExamIntroStatus(e._id, ev.target.value, e.examDate)}
                                  className="px-2 py-1 border rounded-md text-sm w-full"
                                >
                                  <option value="معرفی نشده">معرفی نشده</option>
                                  <option value="معرفی شده">معرفی شده</option>
                                </select>
                                {e.status === 'معرفی شده' && (
                                  <div className="mt-1 grid grid-cols-3 gap-1">
                                    <select value={e.examDate ? e.examDate.split('/')[0] : ''} onChange={(ev) => updateExamIntroStatus(e._id, e.status, `${ev.target.value}/${e.examDate ? e.examDate.split('/')[1] : ''}/${e.examDate ? e.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                      <option value="">سال</option>
                                      {Array.from({ length: 5 }, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={e.examDate ? e.examDate.split('/')[1] : ''} onChange={(ev) => updateExamIntroStatus(e._id, e.status, `${e.examDate ? e.examDate.split('/')[0] : ''}/${ev.target.value}/${e.examDate ? e.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                      <option value="">ماه</option>
                                      {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={e.examDate ? e.examDate.split('/')[2] : ''} onChange={(ev) => updateExamIntroStatus(e._id, e.status, `${e.examDate ? e.examDate.split('/')[0] : ''}/${e.examDate ? e.examDate.split('/')[1] : ''}/${ev.target.value}`)} className="px-1 py-1 border rounded text-xs">
                                      <option value="">روز</option>
                                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>)}
                                    </select>
                                  </div>
                                )}
                              </td>
                              <td className="p-2">

                                <button className="bg-red-500 text-white px-3 py-1 rounded-full" onClick={() => deleteExamIntro(e._id)}>حذف</button>

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  </motion.div>

                )}

                {activeTab === 'mehta' && (
                  <motion.div
                    key="mehta"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-slate-700 mb-2">تعداد کل: <strong>{persons.filter(p => p.isMehtaPlan).length}</strong></div>
                    <motion.button
                      className="bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 mb-4"
                      onClick={() => exportExcel(undefined, 'mehta')}
                      disabled={exportingExcel}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {exportingExcel ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4 text-green-500" />}
                      خروجی اکسل مهتا
                    </motion.button>
                    {selectedIds.size > 0 && (
                      <motion.div className="mb-4">
                        <motion.button
                          className="px-3 py-2 bg-red-500 text-white rounded-md"
                          onClick={deleteSelected}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          حذف انتخاب شده ({selectedIds.size})
                        </motion.button>
                      </motion.div>
                    )}
                    {persons.filter(p => p.isMehtaPlan).length === 0 ? <div className="p-6 text-slate-500">هیچ رکوردی یافت نشد.</div> : (
                      <div className="overflow-x-auto">
                        <table
                          className="w-full text-sm border-collapse bg-white shadow-lg ring-1 ring-gray-200 min-w-[600px]"
                        >
                          <thead>
                            <tr className="text-left text-sm text-indigo-700 bg-gray-50">
                              <th className="p-2"><input type="checkbox" onChange={(e) => { const ids = persons.filter(p => p.isMehtaPlan).map(d => d._id); const all = ids.every(id => selectedIds.has(id)); if (all) setSelectedIds(new Set()); else setSelectedIds(new Set(ids)); }} checked={persons.filter(p => p.isMehtaPlan).length > 0 && persons.filter(p => p.isMehtaPlan).every((d: any) => selectedIds.has(d._id))} /></th>
                              <th className="p-2">ردیف</th>
                              <th className="p-2">نام</th>
                              <th className="p-2 hidden sm:table-cell">نام خانوادگی</th>
                              <th className="p-2">کد ملی</th>
                              <th className="p-2">شماره تماس</th>
                              <th className="p-2 hidden md:table-cell">رشته</th>
                              <th className="p-2">وضعیت</th>
                              <th className="p-2">عکس</th>
                              <th className="p-2">عملیات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {persons.filter(p => p.isMehtaPlan).map((p: any, i: number) => (
                              <tr
                                key={p._id}
                                className="border-b"
                              >
                                <td className="p-2 text-center"><input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                                <td className="p-2">{i + 1}</td>
                                <td className="p-2">{p.firstName}</td>
                                <td className="p-2 hidden sm:table-cell">{p.lastName}</td>
                                <td className="p-2">{p.nationalId}</td>
                                <td className="p-2">{p.phone}</td>
                                <td className="p-2 hidden md:table-cell">{p.skillField}</td>
                                <td className="p-2">
                                  <select value={p.status || 'در انتظار تایید'} onChange={(e) => updatePersonStatus(p._id, e.target.value)} className="px-2 py-1 border rounded-md text-sm">
                                    <option value="در انتظار تایید">در انتظار تایید</option>
                                    <option value="ثبت نام شده">ثبت نام شده</option>
                                    <option value="معرفی به آزمون شده">معرفی به آزمون شده</option>
                                  </select>
                                  {p.status === 'معرفی به آزمون شده' && (
                                    <div className="mt-1 grid grid-cols-3 gap-1">
                                      <select value={p.examDate ? p.examDate.split('/')[0] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${ev.target.value}/${p.examDate ? p.examDate.split('/')[1] : ''}/${p.examDate ? p.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">سال</option>
                                        {Array.from({ length: 5 }, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}
                                      </select>
                                      <select value={p.examDate ? p.examDate.split('/')[1] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${p.examDate ? p.examDate.split('/')[0] : ''}/${ev.target.value}/${p.examDate ? p.examDate.split('/')[2] : ''}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">ماه</option>
                                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                      <select value={p.examDate ? p.examDate.split('/')[2] : ''} onChange={(ev) => updatePersonExamDate(p._id, `${p.examDate ? p.examDate.split('/')[0] : ''}/${p.examDate ? p.examDate.split('/')[1] : ''}/${ev.target.value}`)} className="px-1 py-1 border rounded text-xs">
                                        <option value="">روز</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-center">{p.hasPhoto ? <img src={`/api/persons/${p._id}?photo=true&pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}&t=${Date.now()}`} alt="عکس" className="w-6 h-6 object-cover rounded mx-auto cursor-pointer" onClick={() => setSelectedPhoto(`/api/persons/${p._id}?photo=true&pass=${encodeURIComponent(sessionStorage.getItem('admin_pass') || '')}&t=${Date.now()}`)} /> : ''}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <a href={`/?editId=${p._id}`} className="bg-sky-500 text-white px-3 py-1 rounded-full">ویرایش</a>
                                    <button className="bg-red-500 text-white px-3 py-1 rounded-full" onClick={() => deletePerson(p._id)}>حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-1/3">
            <div className="bg-white rounded-md p-4">
              <div className="flex gap-3 items-center mb-3">
                <motion.button
                  className={`px-4 py-2 rounded-md ${sidebarTab === 'skills' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setSidebarTab('skills')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  دوره‌ها
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-md ${sidebarTab === 'mehta-skills' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setSidebarTab('mehta-skills')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  دوره‌های مهتا
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-md ${sidebarTab === 'announcements' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setSidebarTab('announcements')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  اطلاعیه‌ها
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {sidebarTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-semibold">دوره‌ها (تعریف شده)</div>
                      <div className="text-sm text-slate-600">تعداد: {allSkillOffers.length}</div>
                    </div>
                    <div className="space-y-2">
                      {selectedSkillFilter && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-slate-600">فیلتر: {selectedSkillFilter}</span>
                          <button className="text-sm text-red-500" onClick={() => setSelectedSkillFilter(null)}>پاک کردن</button>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-2"
                      >
                        <input placeholder="افزودن دوره (نام)" className="px-3 py-2 border rounded-md flex-1" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                        <motion.button
                          className={`px-3 py-2 rounded-md ${newSkillName ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          onClick={() => addSkillOffer()}
                          disabled={!newSkillName}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          افزودن
                        </motion.button>
                      </motion.div>
                      <AnimatePresence>
                        {allSkillOffers.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-500"
                          >
                            هیچ دوره‌ای تعریف نشده است.
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                          >
                            {allSkillOffers.map((s: any, index: number) => (
                              <motion.div
                                key={s._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <InlineSkillEditor item={s} onDelete={() => deleteSkillOffer(s._id)} onUpdate={(newName) => updateSkillOffer(s._id, newName)} count={skillCounts[s.skill] || 0} onClick={() => setSelectedSkillFilter(selectedSkillFilter === s.skill ? null : s.skill)} />
                                <motion.button
                                  className="px-2 py-1 bg-emerald-500 text-white rounded-md text-sm"
                                  onClick={() => exportExcel(s.skill)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  خروجی اکسل
                                </motion.button>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {sidebarTab === 'mehta-skills' && (
                  <motion.div
                    key="mehta-skills"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-semibold">دوره‌های مهتا (تعریف شده)</div>
                      <div className="text-sm text-slate-600">تعداد: {allMehtaSkills.length}</div>
                    </div>
                    <div className="space-y-2">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-2"
                      >
                        <input placeholder="افزودن دوره مهتا (نام)" className="px-3 py-2 border rounded-md flex-1" value={newMehtaSkillName} onChange={(e) => setNewMehtaSkillName(e.target.value)} />
                        <motion.button
                          className={`px-3 py-2 rounded-md ${newMehtaSkillName ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          onClick={() => addMehtaSkill()}
                          disabled={!newMehtaSkillName}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          افزودن
                        </motion.button>
                      </motion.div>
                      <AnimatePresence>
                        {allMehtaSkills.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-500"
                          >
                            هیچ دوره مهتا تعریف نشده است.
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                          >
                            {allMehtaSkills.map((s: any, index: number) => (
                              <motion.div
                                key={s._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <InlineSkillEditor item={s} onDelete={() => deleteMehtaSkill(s._id)} onUpdate={(newName) => updateMehtaSkill(s._id, newName)} count={persons.filter(p => p.isMehtaPlan && p.skillField === s.skill).length} onClick={() => { }} />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {sidebarTab === 'announcements' && (
                  <motion.div
                    key="announcements"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-semibold">اطلاعیه‌ها</div>
                      <div className="text-sm text-slate-600">تعداد: {announcements.length}</div>
                    </div>
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <h4 className="font-semibold mb-2">افزودن اطلاعیه جدید</h4>
                        <input placeholder="عنوان" className="w-full px-3 py-2 border rounded-md mb-2" value={newAnnouncementTitle} onChange={(e) => setNewAnnouncementTitle(e.target.value)} />
                        <textarea placeholder="محتوا" className="w-full px-3 py-2 border rounded-md mb-2" rows={3} value={newAnnouncementContent} onChange={(e) => setNewAnnouncementContent(e.target.value)} />
                        <input type="file" accept="image/*" onChange={(e) => setNewAnnouncementImage(e.target.files?.[0] || null)} className="mb-2" />
                        <motion.button
                          className={`px-3 py-2 rounded-md ${newAnnouncementTitle && newAnnouncementContent ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          onClick={() => addAnnouncement()}
                          disabled={!newAnnouncementTitle || !newAnnouncementContent}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          افزودن
                        </motion.button>
                      </div>
                      <AnimatePresence>
                        {announcements.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-500"
                          >
                            هیچ اطلاعیه ای وجود ندارد.
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                          >
                            {announcements.map((a: any, index: number) => (
                              <motion.div
                                key={a._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border rounded-md p-4"
                              >
                                {editingAnnouncement && editingAnnouncement._id === a._id ? (
                                  <div>
                                    <input placeholder="عنوان" className="w-full px-3 py-2 border rounded-md mb-2" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })} />
                                    <textarea placeholder="محتوا" className="w-full px-3 py-2 border rounded-md mb-2" rows={3} value={editingAnnouncement.content} onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })} />
                                    <input type="file" accept="image/*" onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, image: e.target.files?.[0] })} className="mb-2" />
                                    <div className="flex gap-2">
                                      <motion.button
                                        className="px-3 py-2 bg-emerald-500 text-white rounded-md"
                                        onClick={() => updateAnnouncement(a._id, editingAnnouncement.title, editingAnnouncement.content, editingAnnouncement.image)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        ذخیره
                                      </motion.button>
                                      <motion.button
                                        className="px-3 py-2 bg-gray-500 text-white rounded-md"
                                        onClick={() => setEditingAnnouncement(null)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        لغو
                                      </motion.button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h5 className="font-semibold">{a.title}</h5>
                                    <p className="mt-2">{a.content}</p>
                                    {a.imageUrl && <img src={a.imageUrl} alt="تصویر اطلاعیه" className="mt-2 max-w-full h-auto" />}
                                    <div className="flex gap-2 mt-2">
                                      <motion.button
                                        className="px-3 py-1 bg-sky-500 text-white rounded-md"
                                        onClick={() => setEditingAnnouncement(a)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        ویرایش
                                      </motion.button>
                                      <motion.button
                                        className="px-3 py-1 bg-red-500 text-white rounded-md"
                                        onClick={() => deleteAnnouncement(a._id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        حذف
                                      </motion.button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-3xl">
            <img src={selectedPhoto} alt="عکس بزرگ" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

// frontend/src/components/UserManual.jsx
// This component displays a user manual page for the application.
// UPDATED: Corrected RTL alignment for all headings and icons.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, LogIn, Users, Shield, Link as LinkIcon, Laptop, Server, KeyRound, Settings, Download, Upload, FileText, Activity, Edit, Eye } from 'lucide-react';

// Centralized content for easy translation
const translations = {
  pageTitle: {
    en: "User Manual",
    ar: "دليل المستخدم"
  },
  goBack: {
    en: "Go Back to App",
    ar: "العودة إلى التطبيق"
  },
  welcome: {
    title: { en: "Welcome", ar: "مرحباً بك" },
    text: {
      en: "Welcome to the NetDoc application! This guide will help you understand the features and functionalities available based on your user role.",
      ar: "مرحباً بك في تطبيق NetDoc! سيساعدك هذا الدليل على فهم الميزات والوظائف المتاحة بناءً على دورك كمستخدم."
    }
  },
  userRoles: {
    title: { en: "User Roles", ar: "أدوار المستخدمين" },
    admin: {
      title: { en: "Administrator", ar: "المسؤول (Admin)" },
      icon: <Shield size={24} className="text-red-500" />,
      description: {
        en: "Has full control over the application. Can manage all data, users, and system settings.",
        ar: "لديه السيطرة الكاملة على التطبيق. يمكنه إدارة جميع البيانات والمستخدمين وإعدادات النظام."
      }
    },
    editor: {
      title: { en: "Editor", ar: "المحرر (Editor)" },
      icon: <Edit size={24} className="text-yellow-500" />,
      description: {
        en: "Can create, read, update, and delete all network data (PCs, Switches, etc.) but cannot manage users or system-level settings.",
        ar: "يمكنه إنشاء وقراءة وتحديث وحذف جميع بيانات الشبكة (أجهزة الكمبيوتر، السويتشات، إلخ) ولكن لا يمكنه إدارة المستخدمين أو إعدادات النظام."
      }
    },
    viewer: {
      title: { en: "Viewer", ar: "المشاهد (Viewer)" },
      icon: <Eye size={24} className="text-green-500" />,
      description: {
        en: "Has read-only access to all network data. Cannot make any changes.",
        ar: "لديه صلاحية القراءة فقط لجميع بيانات الشبكة. لا يمكنه إجراء أي تغييرات."
      }
    }
  },
  features: {
    connections: {
      title: { en: "Connections", ar: "التوصيلات" },
      icon: <LinkIcon size={32} className="text-gray-500" />,
      description: {
        en: "The main page for viewing and managing all network connections. You can see the full path of a connection, from a PC to a switch, including any patch panel hops in between.",
        ar: "الصفحة الرئيسية لعرض وإدارة جميع توصيلات الشبكة. يمكنك رؤية المسار الكامل للتوصيلة، من جهاز الكمبيوتر إلى السويتش، بما في ذلك أي نقاط توصيل عبر لوحات التوصيل (Patch Panel)."
      }
    },
    devices: {
      title: { en: "Devices (PCs, Switches, Patch Panels)", ar: "الأجهزة (كمبيوترات، سويتشات، لوحات توصيل)" },
      icon: <Laptop size={32} className="text-gray-500" />,
      description: {
        en: "Each device type has its own tab for management. You can add, edit, delete, and view details for each device. For switches and patch panels, you can also view the real-time status of all ports.",
        ar: "كل نوع من الأجهزة له علامة تبويب خاصة به للإدارة. يمكنك إضافة وتعديل وحذف وعرض تفاصيل كل جهاز. بالنسبة للسويتشات ولوحات التوصيل، يمكنك أيضًا عرض الحالة الفورية لجميع المنافذ."
      }
    },
    passwords: {
      title: { en: "Password Manager (Admin Only)", ar: "مدير كلمات المرور (للمسؤول فقط)" },
      icon: <KeyRound size={32} className="text-gray-500" />,
      description: {
        en: "A secure place to store sensitive credentials for network devices, servers, or services. All passwords are encrypted in the database.",
        ar: "مكان آمن لتخزين بيانات الاعتماد الحساسة لأجهزة الشبكة أو الخوادم أو الخدمات. جميع كلمات المرور مشفرة في قاعدة البيانات."
      },
      list: [
        { en: "Click 'Add New Entry' to create a new password record.", ar: "انقر على 'إضافة سجل جديد' لإنشاء سجل كلمة مرور جديدة." },
        { en: "Click the Eye icon to temporarily view a password. This action is logged.", ar: "انقر على أيقونة العين لعرض كلمة المرور مؤقتًا. يتم تسجيل هذا الإجراء." },
        { en: "Click the Clipboard icon to copy a revealed password.", ar: "انقر على أيقونة الحافظة لنسخ كلمة المرور المعروضة." }
      ]
    },
    settings: {
      title: { en: "Settings", ar: "الإعدادات" },
      icon: <Settings size={32} className="text-gray-500" />,
      description: {
        en: "This page provides administrative functions. The options you see depend on your role.",
        ar: "توفر هذه الصفحة وظائف إدارية. الخيارات التي تراها تعتمد على دورك."
      },
      list: [
        { en: "User Management (Admin Only): Create, edit, and delete user accounts and assign roles.", ar: "إدارة المستخدمين (للمسؤول فقط): إنشاء وتعديل وحذف حسابات المستخدمين وتعيين الأدوار." },
        { en: "Data Import (Admin Only): Upload CSV files to bulk-add items.", ar: "استيراد البيانات (للمسؤول فقط): تحميل ملفات CSV لإضافة عناصر بشكل جماعي." },
        { en: "Data Export: Download a complete CSV file of all items in a category.", ar: "تصدير البيانات: تنزيل ملف CSV كامل لجميع العناصر في فئة معينة." },
        { en: "PDF Template Management: Upload and manage PDF templates for printing.", ar: "إدارة قوالب PDF: تحميل وإدارة قوالب PDF للطباعة." },
        { en: "System Activity Log: View a complete audit trail of all actions performed in the system. Admins can revert changes from this log.", ar: "سجل نشاط النظام: عرض سجل تدقيق كامل لجميع الإجراءات التي تم تنفيذها في النظام. يمكن للمسؤولين التراجع عن التغييرات من هذا السجل." }
      ]
    }
  }
};

const ManualSection = ({ title, icon, children }) => (
  <div className="mb-12">
    {/* CORRECTED: Added rtl:justify-end to align the flex items to the right in RTL mode. */}
    <h2 className="text-3xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200 flex items-center rtl:flex-row-reverse rtl:justify-end">
      {icon}
      <span className="mx-3">{title}</span>
    </h2>
    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed rtl:text-right">
      {children}
    </div>
  </div>
);

const RoleCard = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 flex items-center rtl:flex-row-reverse rtl:justify-end mb-3">{icon}<span className="mx-2">{title}</span></h3>
        <p className="text-gray-600 rtl:text-right">{children}</p>
    </div>
);

const UserManual = () => {
    const { user } = useAuth();
    const [language, setLanguage] = useState('en');
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
        return () => {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'en';
        };
    }, [language]);

    const goBack = () => {
        navigate('/');
    };

    return (
    <div className={`bg-gray-50 min-h-screen font-inter ${language === 'ar' ? 'font-sans' : ''}`}>
        <header className="bg-white shadow-md sticky top-0 z-10 no-print">
            {/* CORRECTED: Added rtl:flex-row-reverse to the parent container to swap the title and controls for RTL. */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 rtl:flex-row-reverse">
                {/* Title */}
                {/* CORRECTED: Added rtl:flex-row-reverse here as well to swap the icon and text within the heading. */}
                <h1 className="text-xl sm:text-2xl font-bold text-blue-800 flex items-center whitespace-nowrap rtl:flex-row-reverse">
                    <BookOpen className="mr-3 rtl:ml-3 rtl:mr-0" />
                    {translations.pageTitle[language]}
                </h1>
                
                {/* Controls */}
                <div className="flex items-center flex-shrink-0 space-x-2 sm:space-x-4 rtl:space-x-reverse">
                    <div className="flex items-center border border-gray-300 rounded-full p-0.5 sm:p-1 bg-gray-100">
                        <button onClick={() => setLanguage('en')} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors duration-300 ${language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>EN</button>
                        <button onClick={() => setLanguage('ar')} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors duration-300 ${language === 'ar' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>AR</button>
                    </div>
                    <button onClick={goBack} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                        <ArrowLeft className="mr-1 sm:mr-2 rtl:ml-1 sm:rtl:ml-2 rtl:mr-0" size={18} />
                        <span className="hidden sm:inline">{translations.goBack[language]}</span>
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 sm:p-10">
            <ManualSection title={translations.welcome.title[language]} icon={<LogIn size={32} className="text-gray-500" />}>
                <p>{translations.welcome.text[language]}</p>
            </ManualSection>

            <ManualSection title={translations.userRoles.title[language]} icon={<Users size={32} className="text-gray-500" />}>
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                    <RoleCard title={translations.userRoles.admin.title[language]} icon={translations.userRoles.admin.icon}>{translations.userRoles.admin.description[language]}</RoleCard>
                    <RoleCard title={translations.userRoles.editor.title[language]} icon={translations.userRoles.editor.icon}>{translations.userRoles.editor.description[language]}</RoleCard>
                    <RoleCard title={translations.userRoles.viewer.title[language]} icon={translations.userRoles.viewer.icon}>{translations.userRoles.viewer.description[language]}</RoleCard>
                </div>
            </ManualSection>

            <ManualSection title={translations.features.connections.title[language]} icon={translations.features.connections.icon}>
                <p>{translations.features.connections.description[language]}</p>
            </ManualSection>

            <ManualSection title={translations.features.devices.title[language]} icon={translations.features.devices.icon}>
                <p>{translations.features.devices.description[language]}</p>
            </ManualSection>

            {user && user.role === 'Admin' && (
                <ManualSection title={translations.features.passwords.title[language]} icon={translations.features.passwords.icon}>
                    <p>{translations.features.passwords.description[language]}</p>
                    <ul className="list-disc list-inside mt-4 space-y-2 rtl:text-right">
                        {translations.features.passwords.list.map((item, index) => <li key={index}>{item[language]}</li>)}
                    </ul>
                </ManualSection>
            )}

            {user && user.role !== 'Viewer' && (
                <ManualSection title={translations.features.settings.title[language]} icon={translations.features.settings.icon}>
                    <p>{translations.features.settings.description[language]}</p>
                    <ul className="list-disc list-inside mt-4 space-y-2 rtl:text-right">
                        {translations.features.settings.list.map((item, index) => <li key={index}>{item[language]}</li>)}
                    </ul>
                </ManualSection>
            )}
        </main>
    </div>
  );
};

export default UserManual;

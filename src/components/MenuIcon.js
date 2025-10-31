import React from 'react';
import {
  FaUsers,
  FaShieldAlt,
  FaBars,
  FaCalendarAlt,
  FaUserGraduate,
  FaCog,
  FaListAlt,
  FaBriefcase,
  FaBook,
  FaChalkboardTeacher,
  FaClipboardList,
  FaRegCircle,
  FaBuilding,
} from 'react-icons/fa';

function normalize(key) {
  if (!key) return '';
  return String(key).toLowerCase().replace(/\s|_/g, '-');
}

export default function MenuIcon({ name, className = 'text-base opacity-80' }) {
  const key = normalize(name);

  if (key.includes('user')) return <FaUsers className={className} />;
  if (key.includes('shield')) return <FaShieldAlt className={className} />;
  if (key.includes('menu') || key.includes('bars')) return <FaBars className={className} />;
  if (key.includes('calendar')) return <FaCalendarAlt className={className} />;
  if (key.includes('student') || key.includes('graduate')) return <FaUserGraduate className={className} />;
  if (key.includes('setting') || key.includes('cog')) return <FaCog className={className} />;
  if (key.includes('log') || key.includes('list')) return <FaListAlt className={className} />;
  if (key.includes('briefcase')) return <FaBriefcase className={className} />;
  if (key.includes('book')) return <FaBook className={className} />;
  if (key.includes('class') || key.includes('chalk') || key.includes('teacher')) return <FaChalkboardTeacher className={className} />;
  if (key.includes('clipboard')) return <FaClipboardList className={className} />;
  if (key.includes('department') || key.includes('building')) return <FaBuilding className={className} />;

  return <FaRegCircle className={className} />;
}

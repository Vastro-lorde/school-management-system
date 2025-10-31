import React from 'react';
import { getServerSession } from 'next-auth';
import dbConnect from '../../src/server/db/config.mjs';
import menuService from '../../src/server/services/menuService.js';
import { authOptions } from '../api/auth/[...nextauth].js';
import DashboardLayout from '../../src/components/DashboardLayout';

export default function DashboardPage({ menu }) {
  return (
    <DashboardLayout menu={menu}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="opacity-80">Choose a section from the sidebar to get started.</p>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  await dbConnect();
  const role = session.user?.role || 'student';
  const menu = await menuService.getMenuForRole(role);

  return { props: { menu: JSON.parse(JSON.stringify(menu)) } };
}

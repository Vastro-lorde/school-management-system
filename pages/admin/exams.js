export default function AdminExamsRedirect() { return null; }

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/admin/assessments',
      permanent: false,
    }
  };
}

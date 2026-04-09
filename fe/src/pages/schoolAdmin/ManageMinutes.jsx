import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManageMinutes() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/school-admin/committee', { replace: true });
  }, [navigate]);
  return null;
}

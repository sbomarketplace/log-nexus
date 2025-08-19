import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Redirect component for legacy incident routes
 * Redirects /incident/:id and /incident/:id/edit to /?incidentId=:id
 */
export const IncidentRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirect to home with incident modal open
      navigate(`/?incidentId=${id}`, { replace: true });
    } else {
      // Fallback to home if no ID
      navigate('/', { replace: true });
    }
  }, [id, navigate]);

  // Return null as this component only handles redirection
  return null;
};
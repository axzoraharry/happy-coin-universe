
import { useState, useEffect } from 'react';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the auth callback from the reset password email
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/');
          return;
        }

        // If we have a session, the reset link was valid
        setLoading(false);
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handlePasswordUpdated = () => {
    // Redirect to dashboard after successful password update
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Processing...</h2>
          <p className="text-muted-foreground">Verifying your reset link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <UpdatePasswordForm onPasswordUpdated={handlePasswordUpdated} />
    </div>
  );
};

export default ResetPasswordPage;

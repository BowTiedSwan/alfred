import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks';
import { PermissionRow, Button } from '../../components/shared';

interface PageIndicatorProps {
  current: number;
  total: number;
}

function PageIndicator({ current, total }: PageIndicatorProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '32px',
  };

  const dotStyle = (isActive: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
    transition: 'background-color 0.2s ease',
  });

  return (
    <div style={containerStyle}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={dotStyle(i === current)} />
      ))}
    </div>
  );
}

export function SetupPermissions() {
  const navigate = useNavigate();
  const { permissions, requestPermission, openSystemSettings, allGranted } = usePermissions();
  const [skippable, setSkippable] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSkippable(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleRequest = async (type: 'microphone' | 'accessibility' | 'screen_recording') => {
    if (type === 'microphone') {
      await requestPermission(type);
    } else {
      const section = type === 'accessibility' ? 'Privacy&Security' : 'Privacy&Security';
      await openSystemSettings(section);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/download');
  };

  const handleSkip = () => {
    navigate('/onboarding/download');
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '48px',
    backgroundColor: 'var(--color-background)',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '480px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--color-text)',
    textAlign: 'center',
    marginBottom: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '15px',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    marginBottom: '32px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const permissionsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  };

  const permissionItems = [
    {
      type: 'microphone' as const,
      label: 'Microphone',
      description: 'Handles voice transcription',
      granted: permissions.microphone,
      canRequestDirectly: true,
    },
    {
      type: 'accessibility' as const,
      label: 'Accessibility',
      description: 'Handles copying and pasting into applications',
      granted: permissions.accessibility,
      canRequestDirectly: false,
    },
    {
      type: 'screen_recording' as const,
      label: 'Screenshots',
      description: 'Allows taking screenshots of your screen',
      granted: permissions.screen_recording,
      canRequestDirectly: false,
    },
  ];

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Set Up Alfred</h1>
        <p style={subtitleStyle}>
          Alfred needs a few permissions to work properly.
        </p>

        <div style={permissionsStyle}>
          {permissionItems.map(item => (
            <PermissionRow
              key={item.type}
              type={item.type}
              label={item.label}
              description={item.description}
              granted={item.granted}
              canRequestDirectly={item.canRequestDirectly}
              onRequest={() => handleRequest(item.type)}
              onOpenSettings={() => handleRequest(item.type)}
            />
          ))}
        </div>

        <div style={actionsStyle}>
          {allGranted ? (
            <Button size="lg" onClick={handleContinue}>
              Continue
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={handleContinue}>
                Continue
              </Button>
              {skippable && (
                <Button variant="ghost" size="lg" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
            </>
          )}
        </div>

        <PageIndicator current={0} total={3} />
      </div>
    </div>
  );
}
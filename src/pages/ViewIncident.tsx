import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import { ArrowLeftIcon } from '@/components/icons/CustomIcons';
import { getDateSafely } from '@/utils/safeDate';
import { deriveIncidentTime, formatHHMMForUI } from '@/utils/datetime';
import PageHero from '@/components/common/PageHero';

const ViewIncident = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (id) {
      const foundIncident = storage.getIncident(id);
      setIncident(foundIncident || null);
    }
  }, [id]);

  if (!incident) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-sm font-medium mb-2">Incident Not Found</h2>
          <p className="text-xs text-muted-foreground mb-4">The requested incident could not be found.</p>
          <Button onClick={() => navigate('/')} size="sm">
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIncidentDisplayInfo = (incident: any) => {
    // First check for preferred date/time from original text and timeline
    if (incident.originalEventDateText || incident.timeline) {
      const { getPreferredDateTime } = require('@/utils/timelineParser');
      const preferred = getPreferredDateTime(incident);
      
      if (preferred.date && preferred.time) {
        try {
          const date = new Date(preferred.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          const [hours, minutes] = preferred.time.split(':');
          const hour12 = parseInt(hours) % 12 || 12;
          const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
          const time = `${hour12}:${minutes} ${ampm}`;
          return { date, time };
        } catch {
          // Fall through to original logic
        }
      }
      
      if (preferred.date) {
        try {
          const date = new Date(preferred.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          return { date, time: null };
        } catch {
          // Fall through to original logic
        }
      }
    }
    
    // Check for time in timeline even if no explicit time
    const timelineTime = deriveIncidentTime(incident);
    
    // Fallback to original logic for date
    const date = formatDate(getDateSafely(incident, '')).replace(/,.*day,/, '').replace(/,.*\s/, ' ');
    const time = incident.time ? formatTime(incident.time) : (timelineTime ? formatHHMMForUI(timelineTime) : null);
    
    return { date, time };
  };

  return (
    <Layout>
      <div className="cc-page space-y-6">
        <PageHero 
          title={incident.title || incident.what || "Incident Details"}
          subtitle={(() => {
            const info = getIncidentDisplayInfo(incident);
            const parts = [info.date];
            if (info.time) parts.push(info.time);
            if (incident.category && incident.category !== "Uncategorized") {
              parts.push(`• ${incident.category}`);
            }
            return parts.join(' ');
          })()}
          pad="pt-3"
        />
        
        {/* Back button */}
        <div className="flex justify-start">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
            <ArrowLeftIcon size={16} className="mr-2" />
            Back to Incidents
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{incident.summary}</p>
          </CardContent>
        </Card>

        {/* People Involved */}
        <Card>
          <CardHeader>
            <CardTitle>People Involved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1.5 text-sm">Involved Parties</h4>
                <div className="flex flex-wrap gap-1.5">
                  {incident.who.map((person, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {person.role ? `${person.name} (${person.role})` : person.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {incident.witnesses && incident.witnesses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1.5 text-sm">Witnesses</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {incident.witnesses.map((witness, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {witness.role ? `${witness.name} (${witness.role})` : witness.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incident Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>What Happened</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{incident.what}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{incident.where}</p>
            </CardContent>
          </Card>

          {incident.why && (
            <Card>
              <CardHeader>
                <CardTitle>Why It Happened</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{incident.why}</p>
              </CardContent>
            </Card>
          )}

          {incident.how && (
            <Card>
              <CardHeader>
                <CardTitle>How It Happened</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{incident.how}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Union Involvement */}
        {incident.unionInvolvement && incident.unionInvolvement.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Union Involvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incident.unionInvolvement.map((union, index) => (
                  <div key={index} className="border-l-4 border-accent pl-4">
                    <h4 className="font-medium">{union.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {union.union}{union.role && ` - ${union.role}`}
                    </p>
                    {union.notes && (
                      <p className="text-sm mt-2">{union.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Rewritten Summary */}
        {incident.rewrittenSummary && (
          <Card>
            <CardHeader>
              <CardTitle>AI Enhanced Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{incident.rewrittenSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Files */}
        {incident.files && incident.files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attached Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incident.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-md">
                    <span className="text-sm text-foreground">{file}</span>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default ViewIncident;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import { PlusIcon, AlertIcon, CalendarIcon } from '@/components/icons/CustomIcons';

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIncidents(storage.getIncidents());
  }, []);

  const filteredIncidents = incidents.filter(incident =>
    incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.who.some(person => person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    incident.where.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg font-medium text-foreground">Incident Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage and track workplace incidents</p>
          </div>
          <Link to="/add">
            <Button className="flex items-center space-x-1.5" size="sm">
              <PlusIcon size={14} />
              <span>New Incident</span>
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle>Total Incidents</CardTitle>
              <AlertIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{incidents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle>This Month</CardTitle>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {incidents.filter(incident => {
                  const incidentDate = new Date(incident.date);
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  return incidentDate.getMonth() === currentMonth && 
                         incidentDate.getFullYear() === currentYear;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle>Recent</CardTitle>
              <AlertIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {incidents.filter(incident => {
                  const incidentDate = new Date(incident.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return incidentDate >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">
                  {incidents.length === 0 ? 'No incidents recorded' : 'No incidents found'}
                </h3>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  {incidents.length === 0 
                    ? 'Get started by reporting your first incident.' 
                    : 'Try adjusting your search terms.'}
                </p>
                {incidents.length === 0 && (
                  <Link to="/add">
                    <Button size="sm">
                      <PlusIcon className="mr-1.5" size={14} />
                      Report First Incident
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredIncidents
              .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
              .map((incident) => (
                <Card key={incident.id} className="hover:shadow-md transition-shadow">
                  <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-medium text-sm">{incident.title}</h3>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {formatDate(incident.date)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {incident.summary}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {incident.who.slice(0, 3).map((person, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {person.role ? `${person.name} (${person.role})` : person.name}
                            </Badge>
                          ))}
                          {incident.who.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{incident.who.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Location:</span> {incident.where}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link to={`/incident/${incident.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
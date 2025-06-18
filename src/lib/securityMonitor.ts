import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from './validation';

interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface ThreatPattern {
  type: string;
  threshold: number;
  timeWindow: number; // minutes
  action: 'log' | 'warn' | 'block' | 'escalate';
}

interface SecurityMetrics {
  failedLoginAttempts: number;
  suspiciousTransactions: number;
  rateLimit: number;
  anomalousPatterns: number;
  lastThreatDetected?: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private threatPatterns: ThreatPattern[] = [
    {
      type: 'rapid_failed_logins',
      threshold: 5,
      timeWindow: 15,
      action: 'block'
    },
    {
      type: 'unusual_transfer_amounts',
      threshold: 3,
      timeWindow: 60,
      action: 'warn'
    },
    {
      type: 'multiple_pin_failures',
      threshold: 3,
      timeWindow: 30,
      action: 'escalate'
    },
    {
      type: 'rapid_api_requests',
      threshold: 100,
      timeWindow: 5,
      action: 'block'
    },
    {
      type: 'suspicious_geolocation',
      threshold: 1,
      timeWindow: 1440, // 24 hours
      action: 'warn'
    }
  ];

  private eventHistory: SecurityEvent[] = [];
  private alertCallbacks: ((event: SecurityEvent) => void)[] = [];

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  constructor() {
    this.loadEventHistory();
    this.startPeriodicAnalysis();
  }

  private async loadEventHistory(): Promise<void> {
    try {
      const storedEvents = localStorage.getItem('security_events');
      if (storedEvents) {
        this.eventHistory = JSON.parse(storedEvents);
        // Keep only last 1000 events to prevent memory issues
        this.eventHistory = this.eventHistory.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to load security event history:', error);
    }
  }

  private saveEventHistory(): void {
    try {
      localStorage.setItem('security_events', JSON.stringify(this.eventHistory.slice(-1000)));
    } catch (error) {
      console.warn('Failed to save security event history:', error);
    }
  }

  recordSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.eventHistory.push(fullEvent);
    this.saveEventHistory();

    // Log to console for debugging
    logSecurityEvent(event.eventType, event.details);

    // Analyze for threats
    this.analyzeForThreats(fullEvent);

    // Trigger alerts if severity is high
    if (event.severity === 'high' || event.severity === 'critical') {
      this.triggerAlert(fullEvent);
    }
  }

  private analyzeForThreats(event: SecurityEvent): void {
    this.threatPatterns.forEach(pattern => {
      const recentEvents = this.getRecentEvents(pattern.timeWindow);
      const matchingEvents = recentEvents.filter(e => 
        this.matchesThreatPattern(e, pattern.type)
      );

      if (matchingEvents.length >= pattern.threshold) {
        this.handleThreatDetection(pattern, matchingEvents);
      }
    });
  }

  private matchesThreatPattern(event: SecurityEvent, patternType: string): boolean {
    switch (patternType) {
      case 'rapid_failed_logins':
        return event.eventType.includes('login_failed') || event.eventType.includes('auth_failed');
      
      case 'unusual_transfer_amounts':
        return event.eventType.includes('transfer') && 
               event.details?.amount && 
               event.details.amount > 5000;
      
      case 'multiple_pin_failures':
        return event.eventType.includes('pin') && event.eventType.includes('failed');
      
      case 'rapid_api_requests':
        return event.eventType.includes('api_') || event.eventType.includes('payment_');
      
      case 'suspicious_geolocation':
        return event.eventType.includes('login') && event.details?.suspiciousLocation;
      
      default:
        return false;
    }
  }

  private handleThreatDetection(pattern: ThreatPattern, events: SecurityEvent[]): void {
    const threatEvent: SecurityEvent = {
      eventType: `threat_detected_${pattern.type}`,
      severity: 'critical',
      details: {
        patternType: pattern.type,
        eventCount: events.length,
        threshold: pattern.threshold,
        timeWindow: pattern.timeWindow,
        action: pattern.action,
        affectedUserId: events[0]?.userId
      },
      timestamp: new Date().toISOString()
    };

    this.recordSecurityEvent(threatEvent);
    this.executeThreatResponse(pattern, events);
  }

  private async executeThreatResponse(pattern: ThreatPattern, events: SecurityEvent[]): Promise<void> {
    switch (pattern.action) {
      case 'block':
        await this.blockUser(events[0]?.userId);
        break;
      
      case 'warn':
        await this.sendSecurityWarning(events[0]?.userId);
        break;
      
      case 'escalate':
        await this.escalateToAdmin(pattern, events);
        break;
      
      case 'log':
      default:
        // Already logged, no additional action
        break;
    }
  }

  private async blockUser(userId?: string): Promise<void> {
    if (!userId) return;

    try {
      // In a real implementation, you would temporarily disable the user account
      logSecurityEvent('user_blocked_automatically', { userId, reason: 'threat_detected' });
      
      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Security Alert',
        message: 'Your account has been temporarily secured due to suspicious activity. Please contact support.',
        type: 'security'
      });
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  }

  private async sendSecurityWarning(userId?: string): Promise<void> {
    if (!userId) return;

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Security Warning',
        message: 'We detected unusual activity on your account. Please review your recent transactions.',
        type: 'warning'
      });
    } catch (error) {
      console.error('Failed to send security warning:', error);
    }
  }

  private async escalateToAdmin(pattern: ThreatPattern, events: SecurityEvent[]): Promise<void> {
    try {
      logSecurityEvent('threat_escalated_to_admin', {
        patternType: pattern.type,
        eventCount: events.length,
        affectedUser: events[0]?.userId
      });

      // In a real implementation, this would notify administrators
      console.warn('SECURITY ESCALATION:', {
        pattern: pattern.type,
        events: events.length,
        user: events[0]?.userId
      });
    } catch (error) {
      console.error('Failed to escalate to admin:', error);
    }
  }

  private getRecentEvents(timeWindowMinutes: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.eventHistory.filter(event => 
      new Date(event.timestamp) > cutoff
    );
  }

  private getClientIP(): string {
    // In a real implementation, you would get this from the server
    return 'client-side-unknown';
  }

  private startPeriodicAnalysis(): void {
    // Run security analysis every 5 minutes
    setInterval(() => {
      this.performPeriodicSecurityCheck();
    }, 5 * 60 * 1000);
  }

  private performPeriodicSecurityCheck(): void {
    const recentEvents = this.getRecentEvents(60); // Last hour
    
    if (recentEvents.length > 50) {
      this.recordSecurityEvent({
        eventType: 'high_activity_detected',
        severity: 'medium',
        details: {
          eventCount: recentEvents.length,
          timeWindow: '1 hour'
        }
      });
    }
  }

  getSecurityMetrics(): SecurityMetrics {
    const recentEvents = this.getRecentEvents(60);
    
    return {
      failedLoginAttempts: recentEvents.filter(e => 
        e.eventType.includes('login_failed') || e.eventType.includes('auth_failed')
      ).length,
      suspiciousTransactions: recentEvents.filter(e => 
        e.eventType.includes('transfer') && e.severity !== 'low'
      ).length,
      rateLimit: recentEvents.filter(e => 
        e.eventType.includes('rate_limit')
      ).length,
      anomalousPatterns: recentEvents.filter(e => 
        e.eventType.includes('threat_detected')
      ).length,
      lastThreatDetected: this.eventHistory
        .filter(e => e.eventType.includes('threat_detected'))
        .pop()?.timestamp
    };
  }

  onAlert(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  private triggerAlert(event: SecurityEvent): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
  }

  generateSecurityReport(): {
    summary: SecurityMetrics;
    recentThreats: SecurityEvent[];
    recommendations: string[];
  } {
    const summary = this.getSecurityMetrics();
    const recentThreats = this.getRecentEvents(1440) // Last 24 hours
      .filter(e => e.severity === 'high' || e.severity === 'critical');

    const recommendations = this.generateRecommendations(summary, recentThreats);

    return {
      summary,
      recentThreats,
      recommendations
    };
  }

  private generateRecommendations(metrics: SecurityMetrics, threats: SecurityEvent[]): string[] {
    const recommendations: string[] = [];

    if (metrics.failedLoginAttempts > 10) {
      recommendations.push('Consider implementing CAPTCHA for login attempts');
    }

    if (metrics.suspiciousTransactions > 5) {
      recommendations.push('Review and strengthen transaction validation rules');
    }

    if (metrics.rateLimit > 20) {
      recommendations.push('Consider adjusting rate limiting thresholds');
    }

    if (threats.length > 0) {
      recommendations.push('Immediate review of threat patterns required');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture appears normal');
    }

    return recommendations;
  }
}

export const securityMonitor = SecurityMonitor.getInstance();

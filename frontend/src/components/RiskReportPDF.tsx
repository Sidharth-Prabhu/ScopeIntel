import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a clean font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 20,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  brandSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 30,
    color: '#0f172a',
  },
  reportSub: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 5,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  statGrid: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  finding: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    padding: '3 8',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  findingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  findingTarget: {
    fontSize: 9,
    color: '#3b82f6',
    marginTop: 2,
  },
  findingDesc: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  }
});

interface Finding {
  subdomain: string;
  ip: string;
  type: string;
  severity: string;
  description: string;
  discovered_at: string;
}

interface ReportProps {
  data: {
    domain: string;
    scan_date: string;
    total_assets: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    findings: Finding[];
  };
}

const RiskReportPDF: React.FC<ReportProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>SCOPEINTEL</Text>
          <Text style={styles.brandSub}>Attack Surface Intelligence</Text>
        </View>
        <View style={{ alignItems: 'right' }}>
          <Text style={{ fontSize: 8, color: '#64748b' }}>REPORT ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
          <Text style={{ fontSize: 8, color: '#64748b' }}>DATE: {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.reportTitle}>Infrastructure Risk Analysis</Text>
      <Text style={styles.reportSub}>TARGET: {data.domain.toUpperCase()}</Text>

      {/* Summary Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Intelligence Summary</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            This security audit document outlines the technical findings discovered during the reconnaissance of {data.domain}. 
            A total of {data.total_assets} assets were analyzed. Our systems identified {data.critical_count} critical issues 
            requiring immediate remediation to prevent potential infrastructure compromise.
          </Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{data.critical_count}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{data.high_count}</Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#eab308' }]}>{data.medium_count}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{data.low_count}</Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
      </View>

      {/* Findings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Vulnerability Inventory</Text>
        {data.findings.map((f, i) => (
          <View key={i} style={styles.finding} wrap={false}>
            <View style={styles.findingHeader}>
              <Text style={styles.findingTitle}>{f.type}</Text>
              <View style={[
                styles.severityBadge, 
                { backgroundColor: f.severity === 'Critical' ? '#ef4444' : f.severity === 'High' ? '#f97316' : '#3b82f6' }
              ]}>
                <Text>{f.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.findingTarget}>{f.subdomain} • {f.ip || 'Internal'}</Text>
            <Text style={styles.findingDesc}>{f.description}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated by SecureMap Enterprise Audit System</Text>
        <Text style={styles.footerText}>Strictly Confidential • Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

export default RiskReportPDF;

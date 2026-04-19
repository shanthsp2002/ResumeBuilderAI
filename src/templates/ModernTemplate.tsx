import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { Resume } from '../types/resume';
import { baseColors } from './shared';
import { dateRange, joinNonEmpty } from '../lib/format';

export function ModernTemplate({ data }: { data: Resume }) {
  const { personal, experience, education, skills, projects, accentColor } = data;
  const accent = accentColor || '#2563eb';

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: baseColors.ink,
      lineHeight: 1.45,
    },
    body: { flexDirection: 'row' },
    rail: {
      width: 170,
      backgroundColor: accent,
      color: 'white',
      padding: 24,
      minHeight: '100%',
    },
    main: { flex: 1, padding: 28 },
    name: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
    role: { fontSize: 11.5, marginTop: 2, color: '#e5e7eb' },
    railSection: { marginTop: 18 },
    railHeading: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 6,
      color: '#e5e7eb',
    },
    railText: { fontSize: 9.5, marginBottom: 3, color: 'white' },
    sectionHeading: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: accent,
      marginTop: 12,
      marginBottom: 6,
    },
    entry: { marginBottom: 8 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    entryTitle: { fontFamily: 'Helvetica-Bold' },
    entryMeta: { color: baseColors.muted, fontSize: 9.5 },
    bullet: { flexDirection: 'row', marginTop: 2 },
    bulletDot: { width: 10, color: accent },
    bulletText: { flex: 1 },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.rail}>
            <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
            {personal.title ? <Text style={styles.role}>{personal.title}</Text> : null}

            <View style={styles.railSection}>
              <Text style={styles.railHeading}>Contact</Text>
              {personal.email ? <Text style={styles.railText}>{personal.email}</Text> : null}
              {personal.phone ? <Text style={styles.railText}>{personal.phone}</Text> : null}
              {personal.location ? <Text style={styles.railText}>{personal.location}</Text> : null}
              {personal.website ? <Text style={styles.railText}>{personal.website}</Text> : null}
              {personal.linkedin ? <Text style={styles.railText}>{personal.linkedin}</Text> : null}
              {personal.github ? <Text style={styles.railText}>{personal.github}</Text> : null}
            </View>

            {skills.length > 0 && (
              <View style={styles.railSection}>
                <Text style={styles.railHeading}>Skills</Text>
                {skills.map((g) => (
                  <View key={g.id} style={{ marginBottom: 6 }}>
                    <Text style={{ ...styles.railText, fontFamily: 'Helvetica-Bold' }}>{g.category}</Text>
                    <Text style={styles.railText}>{g.items}</Text>
                  </View>
                ))}
              </View>
            )}

            {education.length > 0 && (
              <View style={styles.railSection}>
                <Text style={styles.railHeading}>Education</Text>
                {education.map((e) => (
                  <View key={e.id} style={{ marginBottom: 6 }}>
                    <Text style={{ ...styles.railText, fontFamily: 'Helvetica-Bold' }}>{e.school}</Text>
                    <Text style={styles.railText}>{joinNonEmpty([e.degree, e.field], ' ')}</Text>
                    <Text style={styles.railText}>{dateRange(e.startDate, e.endDate, false)}</Text>
                    {e.details ? <Text style={styles.railText}>{e.details}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.main}>
            {personal.summary ? (
              <View>
                <Text style={styles.sectionHeading}>Summary</Text>
                <Text>{personal.summary}</Text>
              </View>
            ) : null}

            {experience.length > 0 && (
              <View>
                <Text style={styles.sectionHeading}>Experience</Text>
                {experience.map((e) => (
                  <View key={e.id} style={styles.entry} wrap={false}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>
                        {e.role}
                        {e.company ? `, ${e.company}` : ''}
                      </Text>
                      <Text style={styles.entryMeta}>{dateRange(e.startDate, e.endDate, e.current)}</Text>
                    </View>
                    {e.location ? <Text style={styles.entryMeta}>{e.location}</Text> : null}
                    {e.bullets
                      .filter((b) => b.trim())
                      .map((b, i) => (
                        <View key={i} style={styles.bullet}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{b}</Text>
                        </View>
                      ))}
                  </View>
                ))}
              </View>
            )}

            {projects.length > 0 && (
              <View>
                <Text style={styles.sectionHeading}>Projects</Text>
                {projects.map((p) => (
                  <View key={p.id} style={styles.entry} wrap={false}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle}>{p.name}</Text>
                      {p.link ? (
                        <Link
                          src={p.link.startsWith('http') ? p.link : `https://${p.link}`}
                          style={styles.entryMeta}
                        >
                          {p.link}
                        </Link>
                      ) : null}
                    </View>
                    {p.description ? <Text>{p.description}</Text> : null}
                    {p.bullets
                      .filter((b) => b.trim())
                      .map((b, i) => (
                        <View key={i} style={styles.bullet}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{b}</Text>
                        </View>
                      ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

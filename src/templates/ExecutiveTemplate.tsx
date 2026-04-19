import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { Resume } from '../types/resume';
import { baseColors } from './shared';
import { dateRange, joinNonEmpty } from '../lib/format';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: baseColors.ink,
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: baseColors.ink,
    paddingBottom: 10,
    marginBottom: 12,
  },
  name: { fontSize: 24, fontFamily: 'Times-Bold', letterSpacing: 1.5 },
  title: { fontSize: 12, marginTop: 4, color: baseColors.subtle, fontStyle: 'italic' },
  contact: { fontSize: 10, marginTop: 6, color: baseColors.subtle },
  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 6,
  },
  entry: { marginBottom: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  entryTitle: { fontFamily: 'Times-Bold' },
  entryCompany: { fontFamily: 'Times-Italic' },
  entryMeta: { color: baseColors.muted, fontSize: 10 },
  bullet: { flexDirection: 'row', marginTop: 3 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  summary: { textAlign: 'justify', fontSize: 11, lineHeight: 1.55 },
  skillLine: { marginBottom: 3 },
  skillCategory: { fontFamily: 'Times-Bold' },
});

export function ExecutiveTemplate({ data }: { data: Resume }) {
  const { personal, experience, education, skills, projects } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
          {personal.title ? <Text style={styles.title}>{personal.title}</Text> : null}
          <Text style={styles.contact}>
            {joinNonEmpty([
              personal.email,
              personal.phone,
              personal.location,
              personal.website,
              personal.linkedin,
              personal.github,
            ])}
          </Text>
        </View>

        {personal.summary ? (
          <View>
            <Text style={styles.sectionHeading}>Executive Summary</Text>
            <Text style={styles.summary}>{personal.summary}</Text>
          </View>
        ) : null}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Professional Experience</Text>
            {experience.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.role}</Text>
                    {e.company ? <Text style={styles.entryCompany}>, {e.company}</Text> : null}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {joinNonEmpty([e.location, dateRange(e.startDate, e.endDate, e.current)])}
                  </Text>
                </View>
                {e.bullets
                  .filter((b) => b.trim())
                  .map((b, i) => (
                    <View key={i} style={styles.bullet}>
                      <Text style={styles.bulletDot}>—</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Select Initiatives</Text>
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
                      <Text style={styles.bulletDot}>—</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Education</Text>
            {education.map((e) => (
              <View key={e.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.school}</Text>
                    {e.degree || e.field ? ` — ${joinNonEmpty([e.degree, e.field], ' ')}` : ''}
                  </Text>
                  <Text style={styles.entryMeta}>{dateRange(e.startDate, e.endDate, false)}</Text>
                </View>
                {e.details ? <Text style={styles.entryMeta}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Core Competencies</Text>
            {skills.map((g) => (
              <Text key={g.id} style={styles.skillLine}>
                <Text style={styles.skillCategory}>{g.category}: </Text>
                {g.items}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

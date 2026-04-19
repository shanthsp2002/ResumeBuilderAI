import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { Resume } from '../types/resume';
import { baseColors } from './shared';
import { dateRange, joinNonEmpty } from '../lib/format';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: baseColors.ink,
    lineHeight: 1.35,
  },
  name: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  subhead: { fontSize: 10, color: baseColors.subtle, marginTop: 1 },
  contact: { fontSize: 9, color: baseColors.subtle, marginTop: 3 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 6,
  },
  rule: { flex: 1, height: 1, backgroundColor: baseColors.rule },
  entry: { marginBottom: 5 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  entryTitle: { fontFamily: 'Helvetica-Bold' },
  entryMeta: { color: baseColors.muted, fontSize: 9 },
  bullet: { flexDirection: 'row' },
  bulletDot: { width: 8 },
  bulletText: { flex: 1 },
  skillRow: { flexDirection: 'row' },
  skillCategory: { fontFamily: 'Helvetica-Bold', width: 90 },
});

export function CompactTemplate({ data }: { data: Resume }) {
  const { personal, experience, education, skills, projects } = data;
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.sectionHeading}>{title}</Text>
        <View style={styles.rule} />
      </View>
      {children}
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
        {personal.title ? <Text style={styles.subhead}>{personal.title}</Text> : null}
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

        {personal.summary ? (
          <Section title="Summary">
            <Text>{personal.summary}</Text>
          </Section>
        ) : null}

        {experience.length > 0 && (
          <Section title="Experience">
            {experience.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.role}</Text>
                    {e.company ? <Text>, {e.company}</Text> : null}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {joinNonEmpty([e.location, dateRange(e.startDate, e.endDate, e.current)])}
                  </Text>
                </View>
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
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects">
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
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Education">
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
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills">
            {skills.map((g) => (
              <View key={g.id} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{g.category}</Text>
                <Text>{g.items}</Text>
              </View>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}

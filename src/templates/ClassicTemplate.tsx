import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { Resume } from '../types/resume';
import { baseColors } from './shared';
import { dateRange, joinNonEmpty } from '../lib/format';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    color: baseColors.ink,
    lineHeight: 1.45,
  },
  header: { textAlign: 'center', marginBottom: 14 },
  name: { fontSize: 22, fontFamily: 'Times-Bold', letterSpacing: 1 },
  title: { fontSize: 11.5, marginTop: 2, color: baseColors.subtle },
  contact: { fontSize: 9.5, marginTop: 6, color: baseColors.subtle },
  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    borderBottomWidth: 1,
    borderBottomColor: baseColors.ink,
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 12,
  },
  entry: { marginBottom: 8 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  entryTitle: { fontFamily: 'Times-Bold' },
  entryMeta: { color: baseColors.muted, fontSize: 9.5 },
  bullet: { flexDirection: 'row', marginTop: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  summary: { textAlign: 'justify' },
  skillLine: { flexDirection: 'row', marginBottom: 2 },
  skillCategory: { fontFamily: 'Times-Bold', width: 100 },
  skillItems: { flex: 1 },
});

export function ClassicTemplate({ data }: { data: Resume }) {
  const { personal, experience, education, skills, projects } = data;
  const contactLine = joinNonEmpty([
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ]);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
          {personal.title ? <Text style={styles.title}>{personal.title}</Text> : null}
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        {personal.summary ? (
          <View>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.summary}>{personal.summary}</Text>
          </View>
        ) : null}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Experience</Text>
            {experience.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.role || 'Role'}</Text>
                    {e.company ? <Text>, {e.company}</Text> : null}
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
                    <Link src={p.link.startsWith('http') ? p.link : `https://${p.link}`} style={styles.entryMeta}>
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

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Education</Text>
            {education.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.school}</Text>
                    {e.degree || e.field ? (
                      <Text>
                        {' '}
                        — {joinNonEmpty([e.degree, e.field], ' ')}
                      </Text>
                    ) : null}
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
            <Text style={styles.sectionHeading}>Skills</Text>
            {skills.map((g) => (
              <View key={g.id} style={styles.skillLine}>
                <Text style={styles.skillCategory}>{g.category}</Text>
                <Text style={styles.skillItems}>{g.items}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

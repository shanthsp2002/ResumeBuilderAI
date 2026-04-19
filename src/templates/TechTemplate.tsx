import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { Resume } from '../types/resume';
import { baseColors } from './shared';
import { dateRange, joinNonEmpty } from '../lib/format';

export function TechTemplate({ data }: { data: Resume }) {
  const { personal, experience, education, skills, projects, accentColor } = data;
  const accent = accentColor || '#16a34a';

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: baseColors.ink,
      lineHeight: 1.45,
    },
    header: {
      borderBottomWidth: 2,
      borderBottomColor: accent,
      paddingBottom: 6,
      marginBottom: 10,
    },
    name: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
    role: { fontSize: 11, color: accent, fontFamily: 'Courier-Bold', marginTop: 2 },
    contact: { fontSize: 9.5, color: baseColors.subtle, marginTop: 4, fontFamily: 'Courier' },
    sectionHeading: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginTop: 12,
      marginBottom: 4,
      color: accent,
    },
    prefix: { fontFamily: 'Courier-Bold', color: accent },
    entry: { marginBottom: 8 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    entryTitle: { fontFamily: 'Helvetica-Bold' },
    entryMeta: { color: baseColors.muted, fontSize: 9.5, fontFamily: 'Courier' },
    bullet: { flexDirection: 'row', marginTop: 2 },
    bulletDot: { width: 12, fontFamily: 'Courier-Bold', color: accent },
    bulletText: { flex: 1 },
    skillMatrix: { flexDirection: 'row', flexWrap: 'wrap' },
    skillCell: {
      width: '50%',
      marginBottom: 4,
      paddingRight: 8,
    },
    skillCategory: { fontFamily: 'Helvetica-Bold' },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personal.fullName || 'Your Name'}</Text>
          {personal.title ? <Text style={styles.role}>{'> '}{personal.title}</Text> : null}
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
            <Text style={styles.sectionHeading}>
              <Text style={styles.prefix}>## </Text>summary
            </Text>
            <Text>{personal.summary}</Text>
          </View>
        ) : null}

        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>
              <Text style={styles.prefix}>## </Text>skills
            </Text>
            <View style={styles.skillMatrix}>
              {skills.map((g) => (
                <View key={g.id} style={styles.skillCell}>
                  <Text style={styles.skillCategory}>{g.category}</Text>
                  <Text>{g.items}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>
              <Text style={styles.prefix}>## </Text>experience
            </Text>
            {experience.map((e) => (
              <View key={e.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.role}</Text>
                    {e.company ? <Text> @ {e.company}</Text> : null}
                  </Text>
                  <Text style={styles.entryMeta}>{dateRange(e.startDate, e.endDate, e.current)}</Text>
                </View>
                {e.location ? <Text style={styles.entryMeta}>{e.location}</Text> : null}
                {e.bullets
                  .filter((b) => b.trim())
                  .map((b, i) => (
                    <View key={i} style={styles.bullet}>
                      <Text style={styles.bulletDot}>▸</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>
              <Text style={styles.prefix}>## </Text>projects
            </Text>
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
                      <Text style={styles.bulletDot}>▸</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>
              <Text style={styles.prefix}>## </Text>education
            </Text>
            {education.map((e) => (
              <View key={e.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.school}</Text>
                    {e.degree || e.field ? (
                      <Text> — {joinNonEmpty([e.degree, e.field], ' ')}</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.entryMeta}>{dateRange(e.startDate, e.endDate, false)}</Text>
                </View>
                {e.details ? <Text style={styles.entryMeta}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

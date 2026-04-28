import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// Spark warm palette toned down for professional context
const COLORS = {
  dark: "#2C1810",
  accent: "#8B6010",
  mid: "#6B4226",
  muted: "#9B8A70",
  soft: "#E0D4BC",
  bg: "#FAF8F4",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 48,
    paddingRight: 48,
    backgroundColor: COLORS.white,
    fontSize: 10,
    color: COLORS.dark,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomColor: COLORS.soft,
    borderBottomWidth: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 3,
  },
  title: {
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  contactItem: {
    fontSize: 9,
    color: COLORS.muted,
    marginRight: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomColor: COLORS.soft,
    borderBottomWidth: 0.5,
  },
  summary: {
    fontSize: 10,
    color: COLORS.dark,
    lineHeight: 1.6,
  },
  expEntry: {
    marginBottom: 10,
  },
  expRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  expTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
  },
  expCompany: {
    fontSize: 10,
    color: COLORS.mid,
  },
  expDates: {
    fontSize: 9,
    color: COLORS.muted,
  },
  expLocation: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 3,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 6,
  },
  bulletDot: {
    fontSize: 10,
    color: COLORS.accent,
    marginRight: 5,
    lineHeight: 1.5,
  },
  bulletText: {
    fontSize: 9.5,
    color: COLORS.dark,
    lineHeight: 1.5,
    flex: 1,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillPill: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.soft,
    borderWidth: 0.8,
    borderRadius: 8,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 9,
    color: COLORS.mid,
    marginRight: 5,
    marginBottom: 5,
  },
  eduEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  eduCredential: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
  },
  eduInstitution: {
    fontSize: 9.5,
    color: COLORS.mid,
  },
  eduYear: {
    fontSize: 9,
    color: COLORS.muted,
  },
  additionalItem: {
    fontSize: 9.5,
    color: COLORS.dark,
    marginBottom: 2,
  },
});

export function ResumePDF({ resume }) {
  if (!resume) return null;
  const { header = {}, summary, experience = [], skills = [], education = [], additional = [] } = resume;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          {header.name ? <Text style={styles.name}>{header.name}</Text> : null}
          {header.title ? <Text style={styles.title}>{header.title}</Text> : null}
          <View style={styles.contactRow}>
            {header.email ? <Text style={styles.contactItem}>{header.email}</Text> : null}
            {header.phone ? <Text style={styles.contactItem}>{header.phone}</Text> : null}
            {header.location ? <Text style={styles.contactItem}>{header.location}</Text> : null}
          </View>
        </View>

        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, i) => (
              <View key={i} style={styles.expEntry}>
                <View style={styles.expRow}>
                  <View>
                    <Text style={styles.expTitle}>{exp.title || ""}</Text>
                    {exp.company ? <Text style={styles.expCompany}>{exp.company}</Text> : null}
                  </View>
                  {exp.dates ? <Text style={styles.expDates}>{exp.dates}</Text> : null}
                </View>
                {exp.location ? <Text style={styles.expLocation}>{exp.location}</Text> : null}
                {(exp.achievements || []).map((ach, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{ach}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {skills.map((skill, i) => (
                <Text key={i} style={styles.skillPill}>{skill}</Text>
              ))}
            </View>
          </View>
        ) : null}

        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.eduEntry}>
                <View>
                  <Text style={styles.eduCredential}>{edu.credential || ""}</Text>
                  {edu.institution ? <Text style={styles.eduInstitution}>{edu.institution}</Text> : null}
                </View>
                {edu.year ? <Text style={styles.eduYear}>{edu.year}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {additional.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional</Text>
            {additional.map((item, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.additionalItem}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

      </Page>
    </Document>
  );
}

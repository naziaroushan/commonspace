import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { withNavigation } from "react-navigation";

import studies from "../config/studies";
import {
  Button,
  Caption,
  Card,
  CardContent,
  Divider,
  Title,
  Paragraph
} from "react-native-paper";

class SurveyIndexScreen extends React.Component {
  static navigationOptions = {
    title: "Studies"
  };

  render() {
    return (
      <View style={[styles.container]}>
        <ScrollView stickyHeaderIndices={[0]}>
          <Caption style={styles.sectionTitle}>Your studies</Caption>
          {studies.map(study => (
            <Card elevation={3}>
              <CardContent style={styles.studyHeader}>
                <Title>{study.studyName}</Title>
                <Paragraph>by {study.studyAuthor}</Paragraph>
              </CardContent>
              {study.surveys.map(survey => {
                return (
                  <View>
                    <Divider />
                    <CardContent style={styles.surveyRow}>
                      <Text style={styles.surveyTitle}>{survey.title}</Text>
                      <Button
                        dark
                        raised
                        primary
                        onPress={() =>
                          this.props.navigation.navigate("SurveyScreen", {
                            studyId: study.studyId,
                            surveyId: study.surveyId,
                            studyName: study.studyName,
                            studyAuthor: study.studyAuthor,
                            surveyType: survey.type,
                            surveyTitle: survey.title
                          })
                        }
                      >
                        Start
                      </Button>
                    </CardContent>
                  </View>
                );
              })}
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
    padding: 10
  },
  studyHeader: {
    paddingBottom: 10
  },
  sectionTitle: {
    backgroundColor: "white",
    fontWeight: "bold",
    marginBottom: 10
  },
  surveyRow: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  surveyTitle: {
    fontWeight: "bold"
  }
});

export default withNavigation(SurveyIndexScreen);
require("dotenv").config();

const express = require("express");
const axios = require("axios");

const stravaConfig = {
  clientID: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  callbackURL: process.env.STRAVA_CALLBACK,
};

async function getAccessToken(athlete) {
  refresh_token =
    "steve" === athlete
      ? process.env.STRAVA_REFRESH_TOKEN_STEVE
      : process.env.STRAVA_REFRESH_TOKEN;
  const response = await axios.post(`https://www.strava.com/oauth/token`, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    refresh_token,
    grant_type: "refresh_token",
  });

  return response.data.access_token;
}

// create our Express app
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", async (req, res) => {
  res.send("OK Bob.");
});

app.get("/strava/distance_run/:athlete?", async (req, res) => {
  const athlete = req.params.athlete;
  const accessToken = await getAccessToken(athlete);

  let stats = [];

  // 1/1/2022
  const after = req.query.after || 1641013200;
  const per_page = req.query.per_page || 30;
  let page = req.query.page || 1;
  const endpoint = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&after=${after}&per_page=${per_page}&page=${page}`;

  try {
    let { data } = await axios.get(endpoint);

    if (data.length < 1) {
      res.send([]);
    } else {
      stats = Array.from(data)
        .filter((activity) => activity.type === "Run")
        .map(({ distance, total_elevation_gain, start_date }) => {
          return {
            distance,
            total_elevation_gain,
            start_date,
          };
        });

      res.send(stats);
    }
  } catch (error) {
    console.error(error);
  }
});

app.set("port", process.env.PORT || 7777);
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

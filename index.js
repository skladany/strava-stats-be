require("dotenv").config();

const express = require("express");
const axios = require("axios");

const stravaConfig = {
  clientID: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  callbackURL: process.env.STRAVA_CALLBACK,
};

async function getAccessToken() {
  const response = await axios.post(`https://www.strava.com/oauth/token`, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    refresh_token: process.env.STRAVA_REFRESH_TOKEN,
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

app.get("/strava/distance_run/", async (req, res) => {
  const accessToken = await getAccessToken();

  const stats = {
    distance: 0,
    runs: 0,
  };

  // 1/1/2020
  const after = req.query.after || 1577836800;
  const per_page = req.query.per_page || 30;
  let page = req.query.page || 1;
  const endpoint = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&after=${after}&per_page=${per_page}&page=${page}&`;

  try {
    let { data } = await axios.get(endpoint);

    if (data.length < 1) {
      res.send([]);
    } else {
      stats.distance += Array.from(data)
        .filter((activity) => activity.type === "Run")
        .reduce((distance, activity) => {
          return activity.distance + distance;
        }, 0);

      stats.runs += Array.from(data)
        .filter((activity) => activity.type === "Run")
        .reduce((runs) => {
          return runs + 1;
        }, 0);

      // res.send([stats, data]);
      res.send([stats]);
    }
  } catch (error) {
    console.error(error);
  }
});

app.set("port", process.env.PORT || 7777);
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

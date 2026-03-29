export const setAuthCookies = (res, token) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/api",
  };

  return res.cookie("token", token, options);
};

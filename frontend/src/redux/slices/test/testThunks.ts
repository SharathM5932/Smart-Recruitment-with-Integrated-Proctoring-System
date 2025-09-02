import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../api/axiosInstance";

export const fetchTestData = createAsyncThunk(
  "test/fetchData",
  async ({ token, applicantId, attemptId }: any, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/applicant-questions/resume/${applicantId}/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data; // contains: questions, lastSeenQuestion, attemptCount
    } catch (err) {
      return thunkAPI.rejectWithValue("Unable to resume test");
    }
  }
);

export const submitAnswer = createAsyncThunk(
  "test/submitAnswer",
  async ({
    token,
    applicantId,
    attemptId,
    questionId,
    selectedOptionId,
  }: any) => {
    await axiosInstance.post(
      "/applicant-questions/answer",
      { applicantId, attemptId, questionId, selectedOptionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { questionId };
  }
);

export const skipQuestion = createAsyncThunk(
  "test/skipQuestion",
  async ({ token, applicantId, attemptId, questionId }: any) => {
    await axiosInstance.patch(
      "/applicant-questions/skip",
      { applicantId, attemptId, questionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { questionId };
  }
);

export const evaluateTest = createAsyncThunk(
  "test/evaluate",
  async ({ token, applicantId, attemptId }: any) => {
    const res = await axiosInstance.get(
      `/applicant-questions/evaluate/${applicantId}/${attemptId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }
);

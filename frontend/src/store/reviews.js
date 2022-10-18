import { csrfFetch } from './csrf';
const LOAD_ALL_REVIEWS = "reviews/setLoadAllReviews";
const CREATE_REVIEW = "reviews/setCreateReview";
const ADD_REVIEW_IMG = "reviews/setAddReviewImg";
const UPDATE_REVIEW = "reviews/setUpdateReview";
const DELETE_REVIEW = "reviews/setDeleteReview";


const allReviews = (reviews) => {
  return {
    type: LOAD_ALL_REVIEWS,
    reviews
  }
}

const createReview = (review) => {
  return {
    type: CREATE_REVIEW,
    review
  }
}

const addReviewImg = (reviewId, url) => {
  return {
    type: ADD_REVIEW_IMG,
    reviewId,
    url
  }
}


const updateReview = (review) => {
  return {
    type: UPDATE_REVIEW,
    review
  }
}

const deleteReview = (reviewId) => {
  return {
    type: DELETE_REVIEW,
    reviewId
  }
}

export const getAllReviews = (spotId) => async (dispatch) => {
  const response = await fetch(`/api/spots/${spotId}/reviews`);
  if (response.ok) {
    const reviews = await response.json();
    dispatch(allReviews(reviews));
    return reviews;
  }
  return null;
}

export const createOneReview = (review, spotId, url) => async (dispatch) => {
  // console.log("review store - data received:", typeof review.ratingNum, spotId, url)
  // review.stars = review.ratingNum;
  const response = await csrfFetch(`/api/spots/${spotId}/reviews`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(review)
  });

  if (!response.ok) {
    let error;
    if (response.status === 404) {
      error = await response.json();
      return error;
    } else {
      let errorJSON;
      error=await response.text();
      try{
        errorJSON = JSON.parse(error);
      } catch {
        throw new Error(error);
      }
      throw new Error(`${errorJSON.title}: ${errorJSON.message}`)
    }
  }

  const newReview = await response.json();
  console.log("createOneReview Thunk - newReview:", newReview)
  dispatch(createReview(newReview));

  const imgRes = await csrfFetch(`/api/reviews/${newReview.id}/images`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({url})
  })

  if (!imgRes.ok) {
    let imgError;
    if (imgRes.status === 404) {
      imgError = await imgRes.json();
      // throw new ValidationError(error.errors, response.statusText);
      return imgError;
    } else {
      let imgErrorJSON;
      imgError = await imgRes.text();
      try {
        imgErrorJSON = JSON.parse(imgError);
      } catch {
        throw new Error(imgError);
      }
      throw new Error(`${imgErrorJSON.title}: ${imgErrorJSON.message}`)
    }
  }

  const newImg = await imgRes.json()
  dispatch(addReviewImg(newReview.id, url))

  newReview['ReviewImages'] = newImg;

  return newReview;
}


const initialState = {}

const reviewReducer = (state = initialState, action) => {
  let newState;
  switch (action.type) {
    case LOAD_ALL_REVIEWS:
      newState = { ...state};
      action.reviews.Reviews.forEach(review => {
        newState[review.id] = review;
      })
    return newState;

    case CREATE_REVIEW:
      newState = { ...state };
      newState[action.review.id] = action.review;
      console.log("reviewReducer-CREATE_REVIEW newState:", newState)
    return newState;

    case ADD_REVIEW_IMG:
      newState = { ...state };
      newState[action.reviewId].ReviewImages = [action.url]
    return newState;

    case UPDATE_REVIEW:
    return newState;

    case DELETE_REVIEW:
    return newState;

    default:
      return state;
  }
}

export default reviewReducer;

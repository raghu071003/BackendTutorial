import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409,"User aldready exists!")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log(req.files)
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatarr is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering a user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user Created!")
    )

})

const generateTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken}
    }catch(err){
        throw new ApiError(500,"Something Went wrong while generating tokens")
    }
}

const loginUser = asyncHandler(async (req,res)=>{
    const{email,password,username} = req.body;
    if(!email && !username){
        throw new ApiError(400,"username or email required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user) {
        throw new ApiError(404,"User doesnot exist")
    }
    const isValid = await user.isValidPassword(password)

    if(!isValid) {
        throw new ApiError(401,"Wrong password")
    }
    const{refreshToken,accessToken}=await generateTokens(user._id);
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },"user logged in")
    )

}) 

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    );
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,"User logged out"))

})

const refrshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired")
        }
        const option={
            httpOnly : true,
            secure : true
        }
        const{accessToken,newrefreshToken}=await generateTokens(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newrefreshToken)
        .json(
            new ApiResponse(200,{refreshToken:newrefreshToken},"New Token Generated!")
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refrshAccessToken
}
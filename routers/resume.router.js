const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwtwebToken = require('jsonwebtoken');
const jwtValidate = require('../middleware/jwt-validate.middleware');
const router = express.Router();

router.get('/', async (req, res) => {
    const orderKey = req.query.orderKey ?? 'resumeId';
    const orderValue = req.query.orderValue ?? 'desc';

    if (!['resumeId', 'status'].includes(orderKey)) {
        return res.status(400).json({
            success: false,
            message: 'orderKey 가 올바르지 않습니다.'
        })
    }

    if (!['asc', 'desc'].includes(orderValue.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'orderValue 가 올바르지 않습니다.'
        })
    }

    const resumes = await prisma.resume.findMany({
        select: {
            resumeId: true,
            title: true,
            content: true,
            status: true,
            user: {
                select: {
                    name: true,
                }
            },
            createdAt: true,
        },
        orderBy: [
            {
                [orderKey]: orderValue.toLowerCase(),
            }
        ]
    })

    return res.json({ data: resumes });
})

router.get('/:resumeId', async (req, res) => {
    const resumeId = req.params.resumeId;
    if (!resumeId) {
        return res.status(400).json({
            success: false,
            message: 'resumeId는 필수값입니다.'
        })
    }

    const resume = await prisma.resume.findFirst({
        where: {
            resumeId: Number(resumeId),
        },
        select: {
            resumeId: true,
            title: true,
            content: true,
            status: true,
            user: {
                select: {
                    name: true,
                }
            },
            createdAt: true,
        },
    })

    if (!resume) {
        return res.json({ data: {} });
    }

    return res.json({ data: resume });
})

router.post('/', jwtValidate, async (req, res) => {
    const user = res.locals.user;
    const { title, content } = req.body;
    if (!title) {
        return res.status(400).json({
            success: false,
            message: '이력서 제목은 필수값 입니다'
        })
    }

    if (!content) {
        return res.status(400).json({
            success: false,
            message: '자기소개는 필수값 입니다'
        })
    }

    await prisma.resume.create({
        data: {
            title,
            content,
            status: 'APPLY',
            userId: user.userId,
        }
    })

    return res.status(201).json({});
})

module.exports = router;
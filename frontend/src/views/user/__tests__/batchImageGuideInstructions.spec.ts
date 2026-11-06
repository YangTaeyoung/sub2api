import { describe, expect, it } from 'vitest'
import { buildBatchImageInstructions } from '../batchImageGuideInstructions'

const endpoint = 'https://example.test/'
const locales = ['ko', 'en', 'zh']

function requestBody(text: string) {
  const json = text.match(/\n(\{\n[\s\S]*?\n\})\n/)
  expect(json, 'instructions must include a valid example request').not.toBeNull()
  return JSON.parse(json![1])
}

describe('localized batch image agent instructions', () => {
  it('uses native Korean while retaining English and Chinese', () => {
    const ko = buildBatchImageInstructions('ko-KR', endpoint)
    const en = buildBatchImageInstructions('en-US', endpoint)
    const zh = buildBatchImageInstructions('zh-CN', endpoint)
    expect(ko).toContain('이미지 일괄 생성을 실행하는 에이전트')
    expect(ko).not.toMatch(/[\u4e00-\u9fff]/)
    expect(en).toContain('batch image generation agent')
    expect(en).not.toMatch(/[\u4e00-\u9fff]/)
    expect(zh).toContain('你是 Codex 中的批量生图执行 Agent')
  })

  it.each(locales)('%s keeps all six API routes and methods unchanged', (locale) => {
    const text = buildBatchImageInstructions(locale, endpoint)
    for (const route of [
      'GET https://example.test/v1/images/batches/models',
      'POST https://example.test/v1/images/batches',
      'GET https://example.test/v1/images/batches/{id}',
      'GET https://example.test/v1/images/batches/{id}/items',
      'GET https://example.test/v1/images/batches/{id}/download',
      'POST https://example.test/v1/images/batches/{id}/cancel',
    ]) expect(text).toContain(route)
    expect(text).not.toContain('example.test//')
  })

  it.each(locales)('%s preserves the request example structure and fixed values', (locale) => {
    const body = requestBody(buildBatchImageInstructions(locale, endpoint))
    expect(Object.keys(body)).toEqual(['model', 'task_name', 'image_size', 'response_mime_type', 'items'])
    expect(body.image_size).toBe('1K')
    expect(body.response_mime_type).toBe('image/png')
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toMatchObject({
      custom_id: 'img_001', output_count: 1,
      reference_images: [{ id: 'face', type: 'subject', mime_type: 'image/png' }],
    })
    expect(Object.keys(body.items[0])).toEqual(['custom_id', 'prompt', 'output_count', 'reference_images'])
    expect(body.items[0].reference_images[0].data).toContain('data:image/png;base64,')
  })

  it.each(locales)('%s retains recovery fields, job states, and limits', (locale) => {
    const text = buildBatchImageInstructions(locale, endpoint)
    for (const token of [
      '200', '1000', '128MB', 'output_count', 'expected_output_count',
      'Gemini 2.5 Flash Image', 'Gemini 3 Pro Image', 'gs:// file_uri',
      'batch-image-resume.json', 'endpoint', 'task_name', 'batch_id', 'model',
      'output_dir', 'request_file', 'submitted_at', 'last_status', 'status_url',
      'items_url', 'download_url', 'prompt_count', 'last_checked_at',
      'queued', 'running', 'processing_results',
    ]) expect(text, `${locale} instructions lost ${token}`).toContain(token)
  })
})

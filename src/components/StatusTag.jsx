import React from 'react'
import Tag from '../components/Tag'

export default function StatusTag({ status }) {
  const color =
    status === 'Finalized'
      ? 'green'
      : status === 'Draft'
        ? 'amber'
        : status === 'NeedsReview'
          ? 'red'
          : status === 'Reversed'
            ? 'blue'
            : 'slate'
  return <Tag color={color}>{status || 'Unknown'}</Tag>
}

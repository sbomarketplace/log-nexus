import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { StructuredIncident } from '@/types/export';

export const generateDOCX = async (incident: StructuredIncident): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          text: 'INCIDENT REPORT',
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),

        // Date and Category
        new Paragraph({
          children: [
            new TextRun({ text: 'Date: ', bold: true }),
            new TextRun(incident.dateISO),
            new TextRun({ text: ' | Category: ', bold: true }),
            new TextRun(incident.category)
          ],
          spacing: { after: 200 }
        }),

        // Title
        new Paragraph({
          text: incident.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        }),

        // What Happened
        new Paragraph({
          text: 'WHAT HAPPENED',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: incident.what,
          spacing: { after: 200 }
        }),

        // Where
        new Paragraph({
          text: 'WHERE',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: incident.where,
          spacing: { after: 200 }
        }),

        // When
        new Paragraph({
          text: 'WHEN',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: incident.when,
          spacing: { after: 200 }
        }),

        // Who
        new Paragraph({
          text: 'WHO WAS INVOLVED',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: incident.who.join(', '),
          spacing: { after: 200 }
        }),

        // Witnesses
        ...(incident.witnesses.length > 0 ? [
          new Paragraph({
            text: 'WITNESSES',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: incident.witnesses.join(', '),
            spacing: { after: 200 }
          })
        ] : []),

        // Summary
        new Paragraph({
          text: 'SUMMARY',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: incident.summary,
          spacing: { after: 200 }
        }),

        // Optional sections
        ...(incident.requests ? [
          new Paragraph({
            text: 'REQUESTS & RESPONSES',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: incident.requests,
            spacing: { after: 200 }
          })
        ] : []),

        ...(incident.policy ? [
          new Paragraph({
            text: 'POLICY NOTES',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: incident.policy,
            spacing: { after: 200 }
          })
        ] : []),

        ...(incident.evidence ? [
          new Paragraph({
            text: 'EVIDENCE',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: incident.evidence,
            spacing: { after: 200 }
          })
        ] : []),

        // Timeline table
        ...(incident.timeline.length > 0 ? [
          new Paragraph({
            text: 'TIMELINE',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Time', bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Event', bold: true })] })],
                    width: { size: 80, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              ...incident.timeline.map(item => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(item.time || '')],
                      width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph(item.note)],
                      width: { size: 80, type: WidthType.PERCENTAGE }
                    })
                  ]
                })
              )
            ]
          })
        ] : []),

        // Footer
        new Paragraph({
          text: '',
          spacing: { before: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Created: ', bold: true }),
            new TextRun(new Date(incident.createdAtISO).toLocaleString()),
            ...(incident.updatedAtISO ? [
              new TextRun({ text: ' | Updated: ', bold: true }),
              new TextRun(new Date(incident.updatedAtISO).toLocaleString())
            ] : [])
          ],
          spacing: { before: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Generated by ClearCase on ', italics: true }),
            new TextRun({ text: new Date().toLocaleString(), italics: true })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
};
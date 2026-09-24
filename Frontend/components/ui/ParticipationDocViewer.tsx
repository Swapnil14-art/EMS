'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface ParticipationDocViewerProps {
  url: string;
  title?: string;
  className?: string;
  fillContainer?: boolean;
  onError?: () => void;
}

// Client-side loader for the self-hosted standalone PDF.js bundle
function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib;
    if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
    return Promise.resolve(lib);
  }

  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[src="/pdf.min.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = '/pdf.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const checkReady = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        if (lib.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }
        resolve(lib);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    script.addEventListener('load', () => {
      if (!checkReady()) {
        setTimeout(() => {
          if (!checkReady()) {
            reject(new Error('PDF.js library failed to initialize'));
          }
        }, 50);
      }
    });

    script.addEventListener('error', () => {
      reject(new Error('Failed to load PDF viewer script'));
    });
  });
}

export default function ParticipationDocViewer({
  url,
  title = 'Participation Document',
  className = '',
  fillContainer = false,
  onError,
}: ParticipationDocViewerProps) {
  // Mobile / desktop state detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [forceCustomViewer, setForceCustomViewer] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // PDF.js rendering state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // Detect mobile device or mobile viewport width (< 768px)
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );
      const isMobileWidth = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      setIsMobile(isMobileUA || isMobileWidth);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load PDF document using PDF.js when mobile or forced custom viewer
  const loadPdfDocument = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const pdfjsLib = await loadPdfJs();

      const loadingTask = pdfjsLib.getDocument({
        url,
        withCredentials: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('[ParticipationDocViewer] Error loading PDF:', err);
      const message = err?.message || 'Failed to load PDF preview';
      setLoadError(message);
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, onError]);

  useEffect(() => {
    if ((isMobile || forceCustomViewer) && url) {
      loadPdfDocument();
    }
  }, [isMobile, forceCustomViewer, url, loadPdfDocument]);

  // Cancel any running render task for a page
  const cancelRenderTask = (pageNumber: number) => {
    if (renderTasksRef.current.has(pageNumber)) {
      try {
        const task = renderTasksRef.current.get(pageNumber);
        task.cancel();
      } catch {
        // ignore cancellation errors
      }
      renderTasksRef.current.delete(pageNumber);
    }
  };

  // Render a specific page onto its canvas
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement, containerWidth: number) => {
      if (!pdfDoc) return;

      cancelRenderTask(pageNumber);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate responsive fit scale based on container width
        // Give 24px padding on each side for mobile readability
        const availableWidth = Math.max(containerWidth - 32, 260);
        const baseFitScale = availableWidth / unscaledViewport.width;
        const finalScale = baseFitScale * zoomLevel;

        const viewport = page.getViewport({ scale: finalScale });
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`[ParticipationDocViewer] Render error on page ${pageNumber}:`, err);
        }
      } finally {
        renderTasksRef.current.delete(pageNumber);
      }
    },
    [pdfDoc, zoomLevel]
  );

  // Render all pages whenever pdfDoc, zoomLevel, or container width changes
  useEffect(() => {
    if (!pdfDoc || !scrollContainerRef.current) return;

    const containerWidth = scrollContainerRef.current.clientWidth || 360;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageEl = pageRefs.current[pageNum - 1];
      if (pageEl) {
        const canvas = pageEl.querySelector('canvas');
        if (canvas) {
          renderPage(pageNum, canvas, containerWidth);
        }
      }
    }

    return () => {
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // ignore
        }
      });
      renderTasksRef.current.clear();
    };
  }, [pdfDoc, numPages, zoomLevel, renderPage]);

  // Track currently visible page on scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current || numPages <= 1) return;
    const containerTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;

    for (let i = 0; i < pageRefs.current.length; i++) {
      const pageEl = pageRefs.current[i];
      if (pageEl) {
        const elTop = pageEl.offsetTop - scrollContainerRef.current.offsetTop;
        const elBottom = elTop + pageEl.offsetHeight;
        if (elTop <= containerTop + containerHeight / 2 && elBottom >= containerTop) {
          setCurrentPage(i + 1);
          break;
        }
      }
    }
  };

  // Scroll to a specific page
  const scrollToPage = (pageNum: number) => {
    const target = pageRefs.current[pageNum - 1];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.6));
  };

  const handleZoomReset = () => {
    setZoomLevel(1.0);
  };

  const containerHeightClass = fillContainer ? 'h-full' : 'h-[28rem] sm:h-[36rem]';

  // Desktop native preview:
  // Render exact existing iframe when on desktop and not forced to custom viewer
  if (isMounted && !isMobile && !forceCustomViewer) {
    return (
      <div data-testid="desktop-pdf-viewer" className={`w-full relative flex flex-col ${containerHeightClass} ${className}`}>
        <iframe
          src={`${url}#toolbar=0`}
          title={title}
          className={`w-full h-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)]`}
          onError={() => {
            setForceCustomViewer(true);
            if (onError) onError();
          }}
        />
        {/* Subtle toggle for desktop users if their browser has an issue with native embedding */}
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setForceCustomViewer(true)}
            className="text-[11px] text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] transition-colors"
          >
            Trouble viewing? Switch to built-in reader
          </button>
        </div>
      </div>
    );
  }

  // Mobile / In-Browser Responsive PDF Viewer:
  return (
    <div
      ref={containerRef}
      data-testid="mobile-pdf-viewer"
      className={`w-full flex flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] overflow-hidden ${containerHeightClass} ${className}`}
    >
      {/* Sticky Mobile PDF Viewer Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-[var(--border-subtle)] shrink-0 z-10">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => scrollToPage(currentPage - 1)}
            aria-label="Previous Page"
            className="p-1 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-[var(--text-secondary)] select-none">
            {isLoading ? (
              'Loading...'
            ) : numPages > 0 ? (
              `${currentPage} / ${numPages}`
            ) : (
              '1 / 1'
            )}
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages || isLoading}
            onClick={() => scrollToPage(currentPage + 1)}
            aria-label="Next Page"
            className="p-1 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isLoading || zoomLevel <= 0.6}
            onClick={handleZoomOut}
            aria-label="Zoom Out"
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleZoomReset}
            aria-label="Reset Zoom"
            title="Fit to Width / Reset Zoom"
            className="px-1.5 py-0.5 text-[11px] font-semibold rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            type="button"
            disabled={isLoading || zoomLevel >= 2.5}
            onClick={handleZoomIn}
            aria-label="Zoom In"
            title="Zoom In"
            className="p-1.5 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Desktop switch-back option if forced */}
          {!isMobile && forceCustomViewer && (
            <button
              type="button"
              onClick={() => setForceCustomViewer(false)}
              className="ml-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Native view
            </button>
          )}
        </div>
      </div>

      {/* Main PDF Scrollable Viewing Area */}
      <div
        ref={scrollContainerRef}
        data-testid="pdf-scroll-container"
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 flex flex-col items-center gap-4 scroll-smooth"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6">
            <Loader2 className="w-8 h-8 text-[rgb(var(--color-primary))] animate-spin mb-3" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Loading document preview...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Preparing pages for mobile viewing</p>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Unable to display preview</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">{loadError}</p>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={loadPdfDocument}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Retry
              </button>
              <a
                href={url}
                download
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            </div>
          </div>
        )}

        {!isLoading && !loadError && numPages > 0 && (
          Array.from({ length: numPages }).map((_, index) => {
            const pageNum = index + 1;
            return (
              <div
                key={`pdf-page-${pageNum}`}
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
                className="flex flex-col items-center max-w-full"
              >
                <div className="relative shadow-md rounded-sm bg-white overflow-hidden max-w-full">
                  <canvas className="block max-w-full h-auto" />
                </div>
                {numPages > 1 && (
                  <span className="text-[10px] text-[var(--text-muted)] mt-1.5 select-none font-medium">
                    Page {pageNum} of {numPages}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

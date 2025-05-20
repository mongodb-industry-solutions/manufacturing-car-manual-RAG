"use client";

import React from 'react';
import { 
  H1 as LeafyH1, 
  H2 as LeafyH2, 
  H3 as LeafyH3,
  Body as LeafyBody,
  Subtitle as LeafySubtitle,
  InlineCode as LeafyInlineCode,
  Link as LeafyLink
} from '@leafygreen-ui/typography';
import LeafyCard from '@leafygreen-ui/card';
import LeafyButton from '@leafygreen-ui/button';
import { Spinner as LeafySpinner } from '@leafygreen-ui/loading-indicator';
import LeafyTooltip from '@leafygreen-ui/tooltip';
import LeafyBanner from '@leafygreen-ui/banner';
import LeafyCallout from '@leafygreen-ui/callout';

// MongoDB UI components wrapped for easier usage
export const MyH1 = (props) => <LeafyH1 {...props}>{props.children}</LeafyH1>;
export const MyH2 = (props) => <LeafyH2 {...props}>{props.children}</LeafyH2>;
export const MyH3 = (props) => <LeafyH3 {...props}>{props.children}</LeafyH3>;
export const MyBody = (props) => <LeafyBody {...props}>{props.children}</LeafyBody>;
export const MySubtitle = (props) => <LeafySubtitle {...props}>{props.children}</LeafySubtitle>;
export const MyInlineCode = (props) => <LeafyInlineCode {...props}>{props.children}</LeafyInlineCode>;
export const MyLink = (props) => <LeafyLink {...props}>{props.children}</LeafyLink>;

// Card wrapper
export const MyCard = (props) => <LeafyCard {...props}>{props.children}</LeafyCard>;

// Button wrapper
export const MyButton = (props) => <LeafyButton {...props}>{props.children}</LeafyButton>;

// Spinner wrapper
export const MySpinner = (props) => <LeafySpinner {...props} />;

// Tooltip wrapper
export const MyTooltip = (props) => <LeafyTooltip {...props} />;

// Banner wrapper
export const MyBanner = (props) => <LeafyBanner {...props}>{props.children}</LeafyBanner>;

// Callout wrapper
export const MyCallout = (props) => <LeafyCallout {...props}>{props.children}</LeafyCallout>;